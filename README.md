This is an example implementation of the Model Context Protocol SDK's client code with the Vercel AI SDK which simplifies handling an LLM chat in the browser. Check out [how to make your own mcp servers quick here](https://mcp-framework.com)

## How It Works

1. Connect to an MCP server with SSE through the UI ( you can learn more about [creating mcp servers with SSE](https://mcp-framework.com/docs/Transports/sse))
2. The system automatically discovers available tools
3. Ask it to use the tool

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Then go to `http://localhost:3000` 
