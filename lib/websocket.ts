class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: { [key: string]: Function[] } = {};
  private authToken: string | null = null;

  constructor(private url: string) {
    // 認証トークンをローカルストレージから取得
    try {
      const storedAuth = localStorage.getItem('notetree_auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        this.authToken = authData.session?.access_token;
      }
    } catch (error) {
      console.warn('セッション取得エラー:', error);
    }
    this.connect();
  }

  private connect() {
    try {
      // 認証トークンをURLパラメータに追加
      let connectUrl = this.url;
      if (this.authToken) {
        const separator = this.url.includes('?') ? '&' : '?';
        connectUrl = `${this.url}${separator}token=${this.authToken}`;
      }
      
      this.ws = new WebSocket(connectUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket接続が確立されました');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocketメッセージ受信:', data);
          this.emit('message', data);
        } catch (error) {
          console.error('❌ WebSocketメッセージ解析エラー:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket接続が終了されました');
        this.emit('disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocketエラー:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('❌ WebSocket接続エラー:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 WebSocket再接続試行 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ WebSocket再接続の最大試行回数に達しました');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      console.log('📤 WebSocketメッセージ送信:', data);
    } else {
      console.warn('⚠️ WebSocket接続が確立されていません');
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // 認証トークンを更新するメソッド
  public updateAuthToken(token: string | null) {
    this.authToken = token;
    // トークンが更新されたら再接続
    if (this.ws) {
      this.ws.close();
    }
  }
}

// シングルトンインスタンス
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClient) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
    wsClient = new WebSocketClient(wsUrl);
  }
  return wsClient;
};

export const disconnectWebSocket = () => {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
};

export { WebSocketClient };
