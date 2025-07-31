import { api, ApiResponse } from '@/lib/api';

// モックの設定
const mockFetch = jest.spyOn(global, 'fetch').mockImplementation();

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get()', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: 'test', message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'default',
        url: '',
      } as Response);

      const result = await api.get('/test');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle GET request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      } as Response);

      await expect(api.get('/test')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('post()', () => {
    it('should make POST request successfully', async () => {
      const mockData = { name: 'test' };
      const mockResponse = { data: 'created', message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 201,
        statusText: 'Created',
        headers: new Headers(),
        redirected: false,
        type: 'default',
        url: '',
      } as Response);

      const result = await api.post('/test', mockData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockData),
        })
      );
    });

    it('should handle POST request error', async () => {
      const mockData = { name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Bad Request' }),
      } as Response);

      await expect(api.post('/test', mockData)).rejects.toThrow('HTTP error! status: 400');
    });
  });

  describe('put()', () => {
    it('should make PUT request successfully', async () => {
      const mockData = { name: 'updated' };
      const mockResponse = { data: 'updated', message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'default',
        url: '',
      } as Response);

      const result = await api.put('/test/1', mockData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockData),
        })
      );
    });

    it('should handle PUT request error', async () => {
      const mockData = { name: 'updated' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      } as Response);

      await expect(api.put('/test/1', mockData)).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('delete()', () => {
    it('should make DELETE request successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'deleted' }),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'default',
        url: '',
      } as Response);

      const result = await api.delete('/test/1');
      expect(result).toEqual({ message: 'deleted' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle DELETE request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      } as Response);

      await expect(api.delete('/test/1')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('withAuth()', () => {
    it('should include authorization header when token exists', async () => {
      const mockToken = 'test-token';
      const mockResponse = { data: 'test' };
      
      // ローカルストレージにトークンを設定
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(mockToken),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
      } as Response);

      const result = await api.get('/test');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should not include authorization header when no token exists', async () => {
      const mockResponse = { data: 'test' };
      
      // ローカルストレージにトークンがない状態を設定
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        status: 200,
        statusText: 'OK',
      } as Response);

      const result = await api.get('/test');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'default',
        url: '',
      } as Response);

      await expect(api.get('/test')).rejects.toThrow('Invalid JSON');
    });

    it('should handle different HTTP status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500];
      
      for (const status of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          json: async () => ({ message: `Error ${status}` }),
        } as Response);

        await expect(api.get('/test')).rejects.toThrow(`HTTP error! status: ${status}`);
      }
    });
  });

  // Jestの型定義が不足している場合、describeやitが見つからないエラーが発生します。
  // 必要に応じて `npm i --save-dev @types/jest` を実行してください。
  describe('timeout handling', () => {
    it('should handle request timeout', async () => {
      const originalTimeout = api['timeout'];
      api['timeout'] = 10; // 10ms timeout for testing

      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      await expect(api.get('/test')).rejects.toThrow('Request timeout');

      api['timeout'] = originalTimeout; // Restore original timeout
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed requests', async () => {
      const originalMaxRetries = api['maxRetries'];
      api['maxRetries'] = 3;

      // 最初の2回は失敗、3回目は成功
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Error' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
          status: 200,
          statusText: 'OK',
        } as Response);

      const result = await api.get('/test');
      expect(result).toEqual({ data: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(3);

      api['maxRetries'] = originalMaxRetries; // Restore original maxRetries
    });

    it('should fail after max retries exceeded', async () => {
      const originalMaxRetries = api['maxRetries'];
      api['maxRetries'] = 2;

      // 全てのリクエストが失敗
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Error' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Error' }),
        } as Response);

      await expect(api.get('/test')).rejects.toThrow('HTTP error! status: 500');
      expect(mockFetch).toHaveBeenCalledTimes(3);

      api['maxRetries'] = originalMaxRetries; // Restore original maxRetries
    });
  });
});
