export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  websocket: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
  game: {
    defaultTimeControl: {
      initialTime: number;
      increment: number;
    };
    botThinkingTime: number;
    autoSaveInterval: number;
  };
  ui: {
    animationDuration: number;
    boardSize: number;
    showCoordinates: boolean;
  };
}

export const defaultConfig: AppConfig = {
  api: {
    baseUrl: (typeof window !== 'undefined' ? window.location.origin : '') || 'http://localhost:5000',
    timeout: 10000,
  },
  websocket: {
    url: 'ws://localhost:5000',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  },
  game: {
    defaultTimeControl: {
      initialTime: 600, // 10 minutes
      increment: 5, // 5 seconds per move
    },
    botThinkingTime: 1000,
    autoSaveInterval: 30000, // 30 seconds
  },
  ui: {
    animationDuration: 300,
    boardSize: 480,
    showCoordinates: true,
  },
};
