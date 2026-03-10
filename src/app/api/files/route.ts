import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEMORY_PATH = "/Users/kevinhouston/clawd/memory/divisions/marketing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");

  try {
    if (file) {
      const filePath = path.join(MEMORY_PATH, file);
      if (!filePath.startsWith(MEMORY_PATH)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      const content = fs.readFileSync(filePath, "utf-8");
      return NextResponse.json({ file, content });
    }

    const files = fs.readdirSync(MEMORY_PATH).filter(f => f.endsWith(".md")).sort();
    return NextResponse.json({ path: MEMORY_PATH, files });
  } catch (err) {
    return NextResponse.json({ error: "Failed to read files" }, { status: 500 });
  }
}
