import { NextRequest, NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/server/signal-store";

export async function GET() {
  return NextResponse.json(getConfig());
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const threshold = Number(body?.publishThreshold);
    if (!Number.isFinite(threshold) || threshold < 70 || threshold > 95) {
      return NextResponse.json({ error: "publishThreshold must be between 70 and 95" }, { status: 400 });
    }
    const updated = setConfig({ publishThreshold: threshold });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
