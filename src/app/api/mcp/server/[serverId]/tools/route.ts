import { NextResponse } from "next/server";
import { serverManager } from "../../../server/route";

export async function GET(
  { params }: { params: { serverId: string } }
) {
  try {
    const { serverId } = await params;
    const response = await serverManager.getServerTools(serverId);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { serverId: string } }
) {
  try {
    const { serverId } = await params;
    const { name, args } = await request.json();
    
    const response = await serverManager.callServerTool(serverId, { name, args });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
