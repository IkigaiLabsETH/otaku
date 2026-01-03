declare module '@elizaos/server' {
  import type { Request, Response, NextFunction } from 'express';
  
  export type ServerMiddleware = (req: Request, res: Response, next: NextFunction) => void;
  
  export interface ServerOptions {
    dataDir?: string;
    middlewares?: ServerMiddleware[];
    postgresUrl?: string;
  }
  
  export class AgentServer {
    initialize(options: ServerOptions): Promise<void>;
    registerMiddleware(middleware: ServerMiddleware): void;
    start(port: number): void;
    stop(): Promise<void>;
  }
}
