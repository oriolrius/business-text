import { fetchAllPartials } from './partials';

// Mock Grafana runtime
jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    datasourceRequest: jest.fn(),
  })),
}));

/**
 * fetchAllPartials
 */
describe('fetchAllPartials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should use proxy method for all partials', async () => {
    const item1 = { id: 'test1', name: 'test partial 1', url: 'https://joor.net/template1.html' };
    const item2 = { id: 'test2', name: 'test partial 2', url: 'https://joor.net/template2.html' };
    const replaceVariables = jest.fn((str: string) => str);

    // Mock the backend service
    const mockGetBackendSrv = require('@grafana/runtime').getBackendSrv;
    const mockPost = jest.fn().mockResolvedValue('<p>test content</p>');

    mockGetBackendSrv.mockReturnValue({
      get: jest.fn(),
      post: mockPost,
      datasourceRequest: jest.fn(),
    });

    const result = await fetchAllPartials([item1, item2], replaceVariables);

    // Should make POST requests to the plugin backend for both items
    expect(mockPost).toHaveBeenCalledWith('/api/plugins/volkovlabs-text-panel/resources/fetch-content', {
      url: 'https://joor.net/template1.html',
    });
    expect(mockPost).toHaveBeenCalledWith('/api/plugins/volkovlabs-text-panel/resources/fetch-content', {
      url: 'https://joor.net/template2.html',
    });
    
    expect(result).toEqual([
      { name: item1.name, content: '<p>test content</p>' },
      { name: item2.name, content: '<p>test content</p>' },
    ]);
  });

  it('Should handle proxy errors gracefully', async () => {
    const item = { id: 'test', name: 'test partial', url: 'https://joor.net/template.html' };
    const replaceVariables = jest.fn((str: string) => str);

    // Mock the backend service to fail
    const mockGetBackendSrv = require('@grafana/runtime').getBackendSrv;
    const mockPost = jest.fn().mockRejectedValue(new Error('Backend fetch failed'));

    mockGetBackendSrv.mockReturnValue({
      get: jest.fn(),
      post: mockPost,
      datasourceRequest: jest.fn(),
    });

    await expect(fetchAllPartials([item], replaceVariables)).rejects.toThrow('Failed to fetch via plugin backend from https://joor.net/template.html: Backend fetch failed');
    expect(mockPost).toHaveBeenCalledWith('/api/plugins/volkovlabs-text-panel/resources/fetch-content', {
      url: 'https://joor.net/template.html',
    });
  });
});
