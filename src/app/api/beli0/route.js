import { NextResponse } from "next/server";

// Fungsi buat nomor acak 0878XXXXXXX
function generate0878Number() {
    const middle = Math.floor(10000000 + Math.random() * 90000000); // 8 digit
    return "0878" + middle.toString();
}

export async function GET() {
    const apiKey = "8BCDC5E5-2741-40E6-AFAF-66390970BEDA";

    const requests = [
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
        { no: generate0878Number(), produk: "BPAL1" },
    ];

    const results = await Promise.all(
        requests.map(async ({ no, produk }) => {
            const reff = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const url = `https://panel.khfy-store.com/api_v2/trx?produk=${produk}&tujuan=${no}&reff_id=${reff}&api_key=${apiKey}`;
            try {
                const res = await fetch(url);
                const data = await res.json();
                return { no, produk, data };
            } catch (err) {
                return { no, produk, error: err.message };
            }
        })
    );

    return NextResponse.json(results);
}
