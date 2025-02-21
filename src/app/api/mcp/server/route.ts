import { NextResponse } from "next/server";
import { McpServerManager } from "@/lib/mcp/McpServerManager";
import { McpServerRepository } from "@/lib/mcp/McpServerRepository";

const repository = new McpServerRepository();
export const serverManager = new McpServerManager(repository);

export async function POST(req: Request) {
  const { url } = await req.json();
  try {
    const server = await serverManager.addServer(url);
    return NextResponse.json({ success: true, server });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
