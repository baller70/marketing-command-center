import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    app: "marketing-cc",
    port: 3012,
    status: "online",
    timestamp: new Date().toISOString(),
  });
}
