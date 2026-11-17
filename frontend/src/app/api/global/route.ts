import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      next: { revalidate: 120 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const data = json?.data;
    if (!data) throw new Error("empty");

    return NextResponse.json({
      btcDominance: Number(data.market_cap_percentage?.btc?.toFixed(1) ?? 0),
      totalMarketCap: Number(data.total_market_cap?.usd ?? 0),
    });
  } catch {
    return NextResponse.json({ btcDominance: null, totalMarketCap: null }, { status: 502 });
  }
}
