import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://panel.khfy-store.com/api_v3/cek_stock_akrab");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ ok: false, error: "Gagal ambil stock" });
    }
}
