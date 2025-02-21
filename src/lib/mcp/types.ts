import McpClient from "./McpClient";

export interface McpServer {
  id: string;
  url: string;
  name?: string;
  connected: boolean;
  client: McpClient;
}

export interface ToolOperation {
  name: string;
  args: Record<string, any>;
}

export interface ToolResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export interface ServerToolsResponse {
  success: boolean;
  tools?: any[];
  error?: string;
}
