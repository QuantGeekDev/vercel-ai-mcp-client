import { StreamData, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { McpToolRegistry } from '@/lib/mcp/tool-registry';

const toolRegistry = new McpToolRegistry();

export async function POST(req: Request) {
  const { messages } = await req.json();

  await toolRegistry.refreshTools();
  const tools = toolRegistry.getVercelAiTools();

  const data = new StreamData();

  const result = streamText({
    model: openai('gpt-4'),
    system: 'You are a helpful assistant with access to various tools from connected MCP servers. Use these tools when needed to accomplish tasks.',
    messages,
    tools,
    maxSteps: 5, 
    onStepFinish({ toolCalls, toolResults }) {
      if (toolCalls?.length) {
        console.log('Tool calls:', JSON.stringify(toolCalls));
        console.log('Tool results:', JSON.stringify(toolResults));

        data.appendMessageAnnotation({
          type: 'tool-status',
          toolCalls: toolCalls.map(call => ({
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            args: call.args
          }))
        });
      }
    },
    onFinish() {
      data.close();
    }
  });

  return result.toDataStreamResponse({
    data,
    getErrorMessage: (error: unknown) => {
      if (error instanceof Error) {
        switch (error.name) {
          case 'NoSuchToolError':
            return 'The requested tool is not available.';
          case 'InvalidToolArgumentsError':
            return 'Invalid arguments provided for the tool.';
          case 'ToolExecutionError':
            return 'An error occurred while executing the tool.';
          case 'ToolCallRepairError':
            return 'Failed to repair the tool call.';
          default:
            return `An unexpected error occurred: ${error.message}`;
        }
      }
      return 'An unknown error occurred.';
    }
  });
}
