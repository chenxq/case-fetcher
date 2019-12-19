declare module NodeJS {
  interface Global {
    __context__: any;
    mockServer: any;
    clientHistoryRequest: any;
    WebSocket: any;
  }
}

declare const JSX: any;
