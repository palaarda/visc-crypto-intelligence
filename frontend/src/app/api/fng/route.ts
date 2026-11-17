import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const item = json?.data?.[0];
    if (!item) throw new Error("empty");

    return NextResponse.json({
      value: Number(item.value),
      label: item.value_classification ?? null,
    });
  } catch {
    return NextResponse.json({ value: null, label: null }, { status: 502 });
  }
}
