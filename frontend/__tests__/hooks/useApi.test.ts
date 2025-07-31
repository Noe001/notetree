import { renderHook, act } from '@testing-library/react';
import { useApi } from '@/hooks/useApi';

// モックの設定
const mockFetch = jest.spyOn(global, 'fetch').mockImplementation();

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
      status: 200,
      statusText: 'OK',
    } as Response);

    const { result } = renderHook(() => useApi('/test'));

    // 初期状態の確認
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // データ取得完了を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 成功状態の確認
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Network error';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not Found' }),
    } as Response);

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('HTTP error! status: 404');
  });

  it('should refetch data when url changes', async () => {
    const mockData1 = { id: 1, name: 'Test 1' };
    const mockData2 = { id: 2, name: 'Test 2' };
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
        status: 200,
        statusText: 'OK',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
        status: 200,
        statusText: 'OK',
      } as Response);

    const { result, rerender } = renderHook(({ url }) => useApi(url), {
      initialProps: { url: '/test/1' }
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData1);

    // URLを変更して再レンダリング
    rerender({ url: '/test/2' });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData2);
  });

  it('should not fetch when url is empty', async () => {
    const { result } = renderHook(() => useApi(''));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple concurrent requests', async () => {
    const mockData1 = { id: 1, name: 'Test 1' };
    const mockData2 = { id: 2, name: 'Test 2' };
    
    // 2つのリクエストを同時に処理
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
        status: 200,
        statusText: 'OK',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
        status: 200,
        statusText: 'OK',
      } as Response);

    const { result: result1 } = renderHook(() => useApi('/test/1'));
    const { result: result2 } = renderHook(() => useApi('/test/2'));

    await act(async () => {
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 0)),
        new Promise(resolve => setTimeout(resolve, 0))
      ]);
    });

    expect(result1.current.data).toEqual(mockData1);
    expect(result2.current.data).toEqual(mockData2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle aborting previous requests', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
      status: 200,
      statusText: 'OK',
    } as Response);

    const { result, rerender } = renderHook(({ url }) => useApi(url), {
      initialProps: { url: '/test/1' }
    });

    // URLを素早く変更して前のリクエストを中止
    rerender({ url: '/test/2' });
    rerender({ url: '/test/3' });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // 最後のリクエストのみが成功するはず
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('should handle JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
      status: 200,
      statusText: 'OK',
    } as Response);

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invalid JSON');
  });

  it('should handle network timeout', async () => {
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' }),
        status: 200,
        statusText: 'OK',
      } as Response), 100))
    );

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // タイムアウト前にコンポーネントがアンマウントされた場合の処理
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should cleanup on unmount', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
      status: 200,
      statusText: 'OK',
    } as Response);

    const { result, unmount } = renderHook(() => useApi('/test'));

    // コンポーネントをアンマウント
    unmount();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // アンマウント後も状態は保持されるが、新しいリクエストは発生しない
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
