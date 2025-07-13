import { DataQueryResponse, PanelData, TimeRange, LoadingState } from '@grafana/data';

import { createDataSourceContext, createNotificationContext } from '../utils/dataSource';
import { DataSourcePanelOptions } from '../types';

/**
 * Mock getDataSourceSrv
 */
const mockDataSourceSrv = {
  get: jest.fn(),
  getList: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  getDataSourceSrv: () => mockDataSourceSrv,
}));

describe('Data Source Context', () => {
  const mockPanelData: PanelData = {
    series: [],
    state: LoadingState.Done,
    timeRange: {} as TimeRange,
  } as PanelData;

  const mockTimeRange: TimeRange = {
    from: { valueOf: () => 1000 } as any,
    to: { valueOf: () => 2000 } as any,
    raw: { from: 'now-1h', to: 'now' },
  };

  const mockNotificationContext = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  };

  const mockOptions: DataSourcePanelOptions = {
    enableDataSourceQueries: true,
    queryTimeout: 30000,
    showQueryErrors: true,
    enableCaching: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotificationContext', () => {
    it('should create notification context with proper methods', () => {
      const notifySuccess = jest.fn();
      const notifyError = jest.fn();

      const context = createNotificationContext(notifySuccess, notifyError);

      expect(context).toHaveProperty('success');
      expect(context).toHaveProperty('error');
      expect(context).toHaveProperty('warning');
      expect(context).toHaveProperty('info');

      context.success('test message');
      expect(notifySuccess).toHaveBeenCalledWith(['test message']);

      context.error('error message');
      expect(notifyError).toHaveBeenCalledWith(['error message']);
    });
  });

  describe('createDataSourceContext', () => {
    it('should create data source context when queries are enabled', () => {
      const context = createDataSourceContext(
        mockPanelData,
        mockTimeRange,
        mockNotificationContext,
        mockOptions
      );

      expect(context).toHaveProperty('query');
      expect(context).toHaveProperty('sql');
      expect(context).toHaveProperty('influx');
      expect(context).toHaveProperty('getAvailable');
      expect(context).toHaveProperty('utils');
    });

    it('should return empty data sources list when service fails', () => {
      mockDataSourceSrv.getList.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const context = createDataSourceContext(
        mockPanelData,
        mockTimeRange,
        mockNotificationContext,
        mockOptions
      );

      const dataSources = context.getAvailable();
      expect(dataSources).toEqual([]);
    });

    it('should throw error when queries are disabled', async () => {
      const disabledOptions = { ...mockOptions, enableDataSourceQueries: false };
      const context = createDataSourceContext(
        mockPanelData,
        mockTimeRange,
        mockNotificationContext,
        disabledOptions
      );

      await expect(context.query('test-uid', { refId: 'A' })).rejects.toThrow(
        'Data source queries are disabled in panel options'
      );
    });

    it('should handle SQL queries', async () => {
      const mockDataSource = {
        type: 'postgres',
        query: jest.fn().mockResolvedValue({
          data: [
            {
              fields: [{ name: 'count', values: [42] }],
              length: 1,
            },
          ],
        }),
      };

      mockDataSourceSrv.get.mockResolvedValue(mockDataSource);

      const context = createDataSourceContext(
        mockPanelData,
        mockTimeRange,
        mockNotificationContext,
        mockOptions
      );

      const result = await context.sql('postgres-uid', 'SELECT count(*) FROM users');
      expect(mockDataSource.query).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should format query results correctly', () => {
      const context = createDataSourceContext(
        mockPanelData,
        mockTimeRange,
        mockNotificationContext,
        mockOptions
      );

      const mockResponse: DataQueryResponse = {
        data: [
          {
            fields: [
              { name: 'name', values: ['Alice', 'Bob'] },
              { name: 'age', values: [30, 25] },
            ],
            length: 2,
          },
        ],
        state: LoadingState.Done,
      };

      const formatted = context.utils.formatResults(mockResponse);
      expect(formatted.rows).toHaveLength(2);
      expect(formatted.rows[0]).toEqual({ name: 'Alice', age: 30 });
      expect(formatted.rows[1]).toEqual({ name: 'Bob', age: 25 });
    });

    it('should extract values from specific fields', () => {
      const context = createDataSourceContext(
        mockPanelData,
        mockTimeRange,
        mockNotificationContext,
        mockOptions
      );

      const mockResponse: DataQueryResponse = {
        data: [
          {
            fields: [
              { name: 'name', values: ['Alice', 'Bob'] },
              { name: 'age', values: [30, 25] },
            ],
            length: 2,
          },
        ],
        state: LoadingState.Done,
      };

      const names = context.utils.extractValues(mockResponse, 'name');
      expect(names).toEqual(['Alice', 'Bob']);

      const ages = context.utils.extractValues(mockResponse, 'age');
      expect(ages).toEqual([30, 25]);
    });
  });
});
