import { DataQueryResponse, DataSourceApi } from '@grafana/data';

/**
 * Data Source Query Configuration
 */
export interface DataSourceQueryConfig {
  /**
   * Query refId
   */
  refId?: string;

  /**
   * Raw SQL query (for SQL data sources)
   */
  rawSql?: string;

  /**
   * Query format
   */
  format?: string;

  /**
   * Additional query parameters
   */
  [key: string]: any;
}

/**
 * Data Source Information
 */
export interface DataSourceInfo {
  /**
   * Data source UID
   */
  uid: string;

  /**
   * Data source name
   */
  name: string;

  /**
   * Data source type
   */
  type: string;

  /**
   * Whether the data source is accessible
   */
  accessible?: boolean;
}

/**
 * Data Source Context API
 */
export interface DataSourceContext {
  /**
   * Execute a generic query against a data source
   */
  query: (dataSourceUid: string, queryConfig: DataSourceQueryConfig) => Promise<DataQueryResponse>;

  /**
   * Execute SQL query against SQL-based data sources
   */
  sql: (dataSourceUid: string, sqlQuery: string) => Promise<DataQueryResponse>;

  /**
   * Execute InfluxDB query
   */
  influx: (dataSourceUid: string, influxQuery: string) => Promise<DataQueryResponse>;

  /**
   * Get list of available data sources
   */
  getAvailable: () => DataSourceInfo[];

  /**
   * Get data source by name (fallback helper)
   */
  getByName: (name: string) => Promise<DataSourceApi | null>;

  /**
   * Utility functions for working with query results
   */
  utils: {
    /**
     * Format query response for easier consumption
     */
    formatResults: (response: DataQueryResponse) => any;

    /**
     * Extract values from a specific field
     */
    extractValues: (response: DataQueryResponse, fieldName?: string) => any[];

    /**
     * Convert response to simple object array
     */
    toObjects: (response: DataQueryResponse) => Record<string, any>[];
  };
}

/**
 * Data Source Panel Options
 */
export interface DataSourcePanelOptions {
  /**
   * Enable data source queries
   */
  enableDataSourceQueries: boolean;

  /**
   * Default data source UID
   */
  defaultDataSourceUid?: string;

  /**
   * Query timeout in milliseconds
   */
  queryTimeout: number;

  /**
   * Enable query result caching
   */
  enableCaching: boolean;

  /**
   * Show data source query errors as notifications
   */
  showQueryErrors: boolean;
}

/**
 * Notification Context API
 */
export interface NotificationContext {
  /**
   * Show success notification
   */
  success: (message: string) => void;

  /**
   * Show error notification
   */
  error: (message: string) => void;

  /**
   * Show warning notification
   */
  warning: (message: string) => void;

  /**
   * Show info notification
   */
  info: (message: string) => void;
}
