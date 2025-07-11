import { fetchAllPartials } from './partials';

// Mock Grafana runtime
jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

/**
 * fetchAllPartials
 */
describe('fetchAllPartials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should use backend method for all partials', async () => {
    const item1 = { id: 'test1', name: 'test partial 1', url: 'https://joor.net/template1.html' };
    const item2 = { id: 'test2', name: 'test partial 2', url: 'https://joor.net/template2.html' };
    const replaceVariables = jest.fn((str: string) => str);

    // Mock the backend service
    const mockGetBackendSrv = require('@grafana/runtime').getBackendSrv;
    const mockPost = jest.fn().mockResolvedValue({
      content: '<p>test content</p>'
    });

    mockGetBackendSrv.mockReturnValue({
      get: jest.fn(),
      post: mockPost,
    });

    const result = await fetchAllPartials([item1, item2], replaceVariables);

    // Should make backend POST requests for both items
    expect(mockPost).toHaveBeenCalledWith('/api/plugins/business-text/resources/fetch-content', {
      url: 'https://joor.net/template1.html'
    });
    expect(mockPost).toHaveBeenCalledWith('/api/plugins/business-text/resources/fetch-content', {
      url: 'https://joor.net/template2.html'
    });
    
    expect(result).toEqual([
      { name: item1.name, content: '<p>test content</p>' },
      { name: item2.name, content: '<p>test content</p>' },
    ]);
  });

  it('Should handle backend errors gracefully and fallback to other methods', async () => {
    const item = { id: 'test', name: 'test partial', url: 'https://joor.net/template.html' };
    const replaceVariables = jest.fn((str: string) => str);

    // Mock the backend service to fail
    const mockGetBackendSrv = require('@grafana/runtime').getBackendSrv;
    const mockPost = jest.fn().mockRejectedValue(new Error('Backend not available'));
    const mockGet = jest.fn().mockRejectedValue(new Error('Datasource not found'));

    mockGetBackendSrv.mockReturnValue({
      get: mockGet,
      post: mockPost,
    });

    await expect(fetchAllPartials([item], replaceVariables)).rejects.toThrow();
    expect(mockPost).toHaveBeenCalledWith('/api/plugins/business-text/resources/fetch-content', {
      url: 'https://joor.net/template.html'
    });
  });
});
