import { NextRequest, NextResponse } from "next/server";
import { archiveSignal, unarchiveSignal, deleteSignal } from "@/lib/server/signal-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Arşivle / arşivden çıkar */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const action = body?.action as string;

    if (action === "archive") {
      const rec = archiveSignal(id);
      if (!rec) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
      return NextResponse.json({ ok: true, record: rec });
    }

    if (action === "unarchive") {
      const rec = unarchiveSignal(id);
      if (!rec) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
      return NextResponse.json({ ok: true, record: rec });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** Kalıcı silme — PnL özetinden tamamen çıkarır */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const ok = deleteSignal(id);
  if (!ok) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
