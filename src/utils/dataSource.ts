import {
  AlertErrorPayload,
  AlertPayload,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  PanelData,
  TimeRange,
} from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

import {
  DataSourceContext,
  DataSourceInfo,
  DataSourceQueryConfig,
  NotificationContext,
} from '../types';

/**
 * Default query timeout in milliseconds
 */
const defaultQueryTimeout = 30000;

/**
 * Create Data Source Context
 */
export const createDataSourceContext = (
  panelData: PanelData,
  timeRange: TimeRange,
  notify: NotificationContext,
  options: {
    enableDataSourceQueries: boolean;
    defaultDataSourceUid?: string;
    queryTimeout: number;
    showQueryErrors: boolean;
  }
): DataSourceContext => {
  /**
   * Get Data Source Service
   */
  const getDataSourceService = () => {
    try {
      return getDataSourceSrv();
    } catch (error) {
      const message = 'Data source service not available';
      if (options.showQueryErrors) {
        notify.error(message);
      }
      throw new Error(message);
    }
  };

  /**
   * Execute Generic Query
   */
  const executeQuery = async (
    dataSourceUid: string,
    queryConfig: DataSourceQueryConfig
  ): Promise<DataQueryResponse> => {
    if (!options.enableDataSourceQueries) {
      throw new Error('Data source queries are disabled in panel options');
    }

    try {
      const dataSourceSrv = getDataSourceService();
      
      // Validate and get data source
      let dataSource: DataSourceApi;
      try {
        dataSource = await dataSourceSrv.get(dataSourceUid);
      } catch (error) {
        throw new Error(`Failed to get data source '${dataSourceUid}': ${error instanceof Error ? error.message : String(error)}`);
      }

      if (!dataSource) {
        throw new Error(`Data source with UID '${dataSourceUid}' not found`);
      }

      // Log data source info for debugging
      // console.log('DataSource info:', {
      //   uid: dataSource.uid,
      //   type: dataSource.type,
      //   name: dataSource.name,
      //   meta: dataSource.meta
      // });

      // Create query request
      const request: DataQueryRequest = {
        targets: [
          {
            refId: queryConfig.refId || 'A',
            datasource: {
              uid: dataSource.uid || dataSourceUid,
              type: dataSource.type,
            },
            ...queryConfig,
          },
        ],
        range: timeRange,
        interval: '1s',
        intervalMs: 1000,
        maxDataPoints: 1000,
        requestId: `business-text-${Date.now()}`,
        startTime: Date.now(),
        timezone: panelData.request?.timezone || 'browser',
        app: 'dashboard',
        scopedVars: {},
      };

      // Debug logging for SQLite queries


      // Execute query with timeout
      const timeoutPromise = new Promise<never>((unused, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout after ${options.queryTimeout}ms`));
        }, options.queryTimeout || defaultQueryTimeout);
      });

      const queryPromise = dataSource.query(request);
      const result = await Promise.race([queryPromise, timeoutPromise]);

      // console.log('Query result:', result);
      
      // Handle Observable response by converting to Promise if needed
      let finalResult: DataQueryResponse;
      if (result && typeof (result as { subscribe?: (observer: any) => void }).subscribe === 'function') {
        // It's an Observable, convert to Promise
        finalResult = await new Promise<DataQueryResponse>((resolve, reject) => {
          (result as { subscribe: (observer: any) => void }).subscribe({
            next: (value: DataQueryResponse) => resolve(value),
            error: (error: Error) => reject(error),
            complete: () => {}
          });
        });
      } else {
        finalResult = result as DataQueryResponse;
      }
      
      // Check for empty results and provide helpful debugging
      if (finalResult && finalResult.data) {
        // console.log('Number of data frames:', finalResult.data.length);
        // finalResult.data.forEach((frame: any, index: number) => {
        //   console.log(`Frame ${index}:`, {
        //     name: frame.name,
        //     length: frame.length,
        //     fields: frame.fields?.map((f: any) => ({ name: f.name, type: f.type, values: f.values?.length }))
        //   });
        // });
        
        if (finalResult.data.length === 0) {
          // console.warn('Query returned no data frames. Check your query and data source connection.');
        } else if (finalResult.data.every((frame: any) => frame.length === 0)) {
          // console.warn('Query returned empty data frames. Check if your query matches existing data.');
        }
      } else {
        // console.warn('Query result is null or has no data property:', finalResult);
      }
      
      return finalResult;
    } catch (error) {
      const message = `Query execution failed: ${error instanceof Error ? error.message : String(error)}`;
      if (options.showQueryErrors) {
        notify.error(message);
      }
      throw new Error(message);
    }
  };

  /**
   * Execute SQL Query
   */
  const executeSqlQuery = async (dataSourceUid: string, sqlQuery: string): Promise<DataQueryResponse> => {
    // Get data source to check its type
    const dataSourceSrv = getDataSourceService();
    const dataSource = await dataSourceSrv.get(dataSourceUid);
    

    
    // Build query config based on data source type
    let queryConfig: DataSourceQueryConfig;
    
    if (dataSource.type === 'grafana-postgresql-datasource' || 
        dataSource.type === 'postgres' ||
        dataSource.type === 'mysql') {
      // For SQL-based data sources, use rawSql
      queryConfig = {
        rawSql: sqlQuery,
        format: 'table',
        refId: 'A',
      };
    } else if (dataSource.type === 'frser-sqlite-datasource') {
      // For SQLite data source, use queryText and rawQueryText
      queryConfig = {
        queryText: sqlQuery,
        rawQueryText: sqlQuery,
        query: sqlQuery, // Also set query as fallback
        queryType: 'table',
        format: 'table',
        refId: 'A',
      };

    } else {
      // For other data sources, try using query field
      queryConfig = {
        query: sqlQuery,
        format: 'table',
        refId: 'A',
      };
    }
    

    
    return executeQuery(dataSourceUid, queryConfig);
  };

  /**
   * Execute InfluxDB Query
   */
  const executeInfluxQuery = async (dataSourceUid: string, influxQuery: string): Promise<DataQueryResponse> => {
    return executeQuery(dataSourceUid, {
      query: influxQuery,
      refId: 'A',
    });
  };

  /**
   * Get Available Data Sources
   */
  const getAvailableDataSources = (): DataSourceInfo[] => {
    try {
      const dataSourceSrv = getDataSourceService();
      const dataSources = dataSourceSrv.getList();

      // console.log('Available data sources:', dataSources);

      return dataSources.map((ds) => ({
        uid: ds.uid,
        name: ds.name,
        type: ds.type,
        accessible: true,
      }));
    } catch (error) {
      // console.error('Failed to get data sources:', error);
      if (options.showQueryErrors) {
        notify.error('Failed to get available data sources');
      }
      return [];
    }
  };

  /**
   * Get Data Source by Name (fallback helper)
   */
  const getDataSourceByName = async (name: string): Promise<DataSourceApi | null> => {
    try {
      const dataSourceSrv = getDataSourceService();
      const dataSources = dataSourceSrv.getList();
      const found = dataSources.find(ds => ds.name === name);
      
      if (found) {
        return await dataSourceSrv.get(found.uid);
      }
      return null;
    } catch (error) {
      // console.error('Failed to get data source by name:', error);
      return null;
    }
  };

  /**
   * Utility Functions
   */
  const utils = {
    /**
     * Format Results
     */
    formatResults: (response: DataQueryResponse) => {
      if (!response.data || response.data.length === 0) {
        return { 
          series: [] as any[], 
          rows: [] as Array<Record<string, any>>, 
          fields: [] as string[],
          raw: response
        };
      }

      const series = response.data;
      const rows = series.map((frame) => {
        if (!frame.fields || frame.fields.length === 0) {
          return [];
        }

        const result = [];
        const length = frame.length || 0;

        for (let i = 0; i < length; i++) {
          const row: Record<string, any> = {};
          frame.fields.forEach((field: any) => {
            row[field.name] = field.values[i];
          });
          result.push(row);
        }

        return result;
      });

      const fields = series.length > 0 ? series[0].fields?.map((field: any) => field.name) || [] : [];

      return {
        series,
        rows: rows.flat(),
        fields,
        raw: response,
      };
    },

    /**
     * Extract Values
     */
    extractValues: (response: DataQueryResponse, fieldName?: string): any[] => {
      if (!response.data || response.data.length === 0) {
        return [];
      }

      const values: any[] = [];

      response.data.forEach((frame) => {
        if (!frame.fields) {
          return;
        }

        if (fieldName) {
          const field = frame.fields.find((f: any) => f.name === fieldName);
          if (field && field.values) {
            values.push(...field.values);
          }
        } else {
          // If no field name specified, get values from first field
          if (frame.fields.length > 0 && frame.fields[0].values) {
            values.push(...frame.fields[0].values);
          }
        }
      });

      return values;
    },

    /**
     * Convert to Objects
     */
    toObjects: (response: DataQueryResponse): Array<Record<string, any>> => {
      const formatted = utils.formatResults(response);
      return formatted.rows;
    },


  };

  return {
    query: executeQuery,
    sql: executeSqlQuery,
    influx: executeInfluxQuery,
    getAvailable: getAvailableDataSources,
    getByName: getDataSourceByName,
    utils,
  };
};

/**
 * Create Notification Context
 */
export const createNotificationContext = (
  notifySuccess: (payload: AlertPayload) => void,
  notifyError: (payload: AlertErrorPayload) => void
): NotificationContext => {
  return {
    success: (message: string) => notifySuccess([message]),
    error: (message: string) => notifyError([message]),
    warning: (message: string) => notifyError([`Warning: ${message}`]),
    info: (message: string) => notifySuccess([`Info: ${message}`]),
  };
};
