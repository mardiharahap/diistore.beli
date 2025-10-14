"use client";
import { useState, useCallback, useEffect } from "react";

export default function Page() {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preorder, setPreorder] = useState(null);

  const normalizeLines = (text) =>
    Array.from(
      new Set(
        (text || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      )
    );

  const handleRun = useCallback(async (customInput = null) => {
    setError("");
    const raw = customInput ?? inputText;
    const lines = normalizeLines(raw);
    if (lines.length === 0) {
      setError("Masukkan minimal satu perintah pembelian!");
      return;
    }

    const requests = lines.map((line) => {
      const parts = line.split(" ").filter(Boolean);
      return { produk: parts[1], no: parts[2] };
    });

    setLoading(true);
    try {
      const res = await fetch("/api/beli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError("Gagal mengirim request: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  // Preorder effect
  useEffect(() => {
    if (!preorder) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = preorder.jadwal - now;
      if (Math.abs(diff) <= 700) {
        handleRun(preorder.daftar)
          .finally(() => setPreorder(null));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [preorder, handleRun]);

  const handleSavePreorder = (hh, mm, ss) => {
    const daftarTrimmed = inputText.trim();
    if (!daftarTrimmed) return alert("Daftar pembelian kosong!");

    const now = new Date();
    let jadwal = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hh, mm, ss
    );
    if (jadwal <= now) jadwal.setDate(jadwal.getDate() + 1);
    setPreorder({ daftar: daftarTrimmed, jadwal });
    alert(`✅ Preorder disimpan. Akan dikirim pukul ${jadwal.toLocaleTimeString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <h1 className="text-4xl font-bold mb-6">💎 Diistore Panel</h1>

      <textarea
        rows={6}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="beli BPAL1 08123456789"
        className="w-full max-w-2xl p-3 border rounded-xl mb-3"
      />

      <div className="flex gap-3 mb-3">
        <button
          onClick={() => handleRun()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Memproses..." : "Mulai Request"}
        </button>

        <button
          onClick={() => handleSavePreorder(15, 30, 0)} // contoh jam 15:30:00
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Preorder
        </button>
      </div>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      {results.length > 0 && (
        <table className="border border-gray-300 w-full max-w-3xl text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">No HP</th>
              <th className="px-2 py-1">Produk</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Pesan</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-2 py-1">{r.no}</td>
                <td className="px-2 py-1">{r.produk}</td>
                <td className="px-2 py-1">{r.data?.status ? "Sukses" : "Gagal"}</td>
                <td className="px-2 py-1">{r.data?.message || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
