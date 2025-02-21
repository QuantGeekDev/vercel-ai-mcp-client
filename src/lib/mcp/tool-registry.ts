import { Tool, tool } from 'ai';
import { serverManager } from '@/app/api/mcp/server/route';
import { convertJsonSchemaToZod } from './schema-utils';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

interface McpToolResponse {
  tools: McpToolDefinition[];
}

function createMcpTool(serverId: string, toolDef: McpToolDefinition): Tool {
  return tool({
    description: toolDef.description,
    parameters: convertJsonSchemaToZod(toolDef.inputSchema),
    execute: async (args) => {
      try {
        const server = serverManager.getServerById(serverId);
        if (!server) {
          throw new Error(`Server ${serverId} not found`);
        }

        const result = await server.client.callTool({
          name: toolDef.name,
          args
        });

        return {
          type: 'text',
          content: JSON.stringify(result)
        };
      } catch (error: any) {
        console.error(`Tool execution error for ${toolDef.name}:`, error);
        throw error;
      }
    }
  });
}

export class McpToolRegistry {
  private toolMap = new Map<string, {
    serverId: string;
    tool: McpToolDefinition;
  }>();

  async refreshTools() {
    this.toolMap.clear();
    const servers = serverManager.getServers();
    
    for (const server of servers) {
      try {
        const response = await server.client.listTools();
        
        const toolsResponse = response as McpToolResponse;
        if (toolsResponse.tools && Array.isArray(toolsResponse.tools)) {
          toolsResponse.tools.forEach((tool: McpToolDefinition) => {
            this.toolMap.set(tool.name, {
              serverId: server.id,
              tool: {
                name: tool.name,
                description: tool.description || '',
                inputSchema: tool.inputSchema
              }
            });
          });
        }
      } catch (error) {
        console.error(`Failed to fetch tools from server ${server.id}:`, error);
      }
    }
  }

  getVercelAiTools(): Record<string, Tool> {
    const tools: Record<string, Tool> = {};
    this.toolMap.forEach((value, key) => {
      tools[key] = createMcpTool(value.serverId, value.tool);
    });
    return tools;
  }

  getToolCount(): number {
    return this.toolMap.size;
  }

  getToolsByServer(serverId: string): McpToolDefinition[] {
    const serverTools: McpToolDefinition[] = [];
    this.toolMap.forEach((value) => {
      if (value.serverId === serverId) {
        serverTools.push(value.tool);
      }
    });
    return serverTools;
  }
}
