import { NextResponse } from "next/server";

const API_KEY = "8BCDC5E5-2741-40E6-AFAF-66390970BEDA";

export async function GET() {
    try {
        const res = await fetch(
            `https://panel.khfy-store.com/api_v2/list_product?api_key=${API_KEY}`
        );
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ ok: false, error: "Gagal ambil produk" });
    }
}
