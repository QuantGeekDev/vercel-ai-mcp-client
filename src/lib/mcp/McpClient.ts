import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";


export default class McpClient {
  client: Client;
  transport: SSEClientTransport;

  constructor(public url: URL){
    this.client =  new Client({
      name: "vercel-ai-client",
      version:"1.0.0"
    },
    {
      capabilities:{
        tools:{},
        resources: {},
        prompts: {}
      }
    })
    
    this.transport = new SSEClientTransport(url)

  }

  public async connect(){
    try {
      await this.client.connect(this.transport)
    } catch (error){
      console.log(`Error connecting to MCP server:`, JSON.stringify(error))
      throw new Error("Connection to MCP Server failed")
    } 
  }

  public async listTools(){
    const tools = await this.client.listTools()
    return tools
  }

  public async callTool({name, args}: {name: any, args: any}){
    const result = await this.client.callTool({
      name,
      arguments: args
    })
    return result
  }
  
}






