import McpClient from "./McpClient";

const clients: Record<string, Promise<McpClient>> = {};

export async function getOrCreateConnectedMcpClient(url: string): Promise<McpClient> {
  if (!clients[url]) {
    const client = new McpClient(new URL(url));
    clients[url] = client.connect().then(() => client);
  }
  return clients[url];
}
