import { McpServer } from "./types";

export class McpServerRepository {
  private servers: McpServer[] = [];

  public add(server: McpServer) {
    this.servers.push(server);
  }

  public getAll(): McpServer[] {
    return this.servers;
  }

  public find(url: string): McpServer | undefined {
    return this.servers.find((server) => server.url === url);
  }

  public findById(id: string): McpServer | undefined {
    return this.servers.find((server) => server.id === id);
  }

  public remove(id: string): boolean {
    const index = this.servers.findIndex((server) => server.id === id);
    if (index === -1) return false;
    this.servers.splice(index, 1);
    return true;
  }
}
