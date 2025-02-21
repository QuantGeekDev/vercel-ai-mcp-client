import { McpServerRepository } from "./McpServerRepository";
import { McpServer, ToolOperation, ToolResponse, ServerToolsResponse } from "./types";
import McpClient from "./McpClient";
import { randomUUID } from "crypto";

export class McpServerManager {
  constructor(private repository: McpServerRepository) {}

  async addServer(url: string): Promise<McpServer> {
    const existing = this.repository.find(url);
    if (existing) {
      console.warn("Server already connected", url);
      return existing;
    }

    const connectionUrl = new URL(url);
    const client = new McpClient(connectionUrl);
    await client.connect();

    const server: McpServer = {
      id: randomUUID(),
      url,
      connected: true,
      name: "Meow",
      client
    };

    this.repository.add(server);
    return server;
  }

  getServers(): McpServer[] {
    return this.repository.getAll();
  }

  async getServerTools(serverId: string): Promise<ServerToolsResponse> {
    try {
      const server = this.repository.findById(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      const tools = await server.client.listTools();
      return { success: true, tools };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async callServerTool(serverId: string, operation: ToolOperation): Promise<ToolResponse> {
    try {
      const server = this.repository.findById(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      const result = await server.client.callTool({
        name: operation.name,
        args: operation.args
      });
      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getServerById(serverId: string): McpServer | undefined {
    return this.repository.findById(serverId);
  }

  removeServer(serverId: string): boolean {
    return this.repository.remove(serverId);
  }
}
