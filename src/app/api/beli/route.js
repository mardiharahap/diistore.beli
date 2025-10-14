import { NextResponse } from "next/server";

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function POST(req) {
  const { requests } = await req.json(); // kirim dari client
  const apiKey = "8BCDC5E5-2741-40E6-AFAF-66390970BEDA";

  const capacityPerSecond = 4; // maksimal 4 trx/detik
  let tokens = capacityPerSecond;

  const refill = setInterval(() => (tokens = capacityPerSecond), 1000);

  const results = [];

  async function sendRequest(item) {
    const reff = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const url = `https://panel.khfy-store.com/api_v2/trx?produk=${item.produk}&tujuan=${item.no}&reff_id=${reff}&api_key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();

      // Jika kena rate limit, tunggu retry
      if (data.error === "rate_limited" && data.retry_after_ms) {
        await delay(data.retry_after_ms + 10);
        return sendRequest(item);
      }

      return { no: item.no, produk: item.produk, data };
    } catch (err) {
      return { no: item.no, produk: item.produk, data: { status: false, message: err.message } };
    }
  }

  for (const item of requests) {
    while (tokens <= 0) await delay(10); // tunggu token refill
    tokens--;
    results.push(await sendRequest(item));
  }

  clearInterval(refill);
  return NextResponse.json(results);
}
