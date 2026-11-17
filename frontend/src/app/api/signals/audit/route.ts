import { NextResponse } from "next/server";
import { getAudit } from "@/lib/server/signal-store";

/** Denetim kaydı — yalnızca yönetici panelinde gösterilir */
export async function GET() {
  return NextResponse.json({ audit: getAudit() });
}
