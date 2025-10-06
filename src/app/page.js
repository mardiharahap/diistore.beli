"use client";
import { useState, useEffect } from "react";

export default function Page() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  // === Untuk Modal Stok ===
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingStock, setLoadingStock] = useState(false);

  const handleRun = async () => {
    setError("");
    setResults([]);
    if (!inputText.trim()) return setError("Masukkan minimal satu baris perintah.");

    setLoading(true);
    const lines = inputText.split("\n").map(line => line.trim()).filter(Boolean);

    // simulasi eksekusi (ganti dengan logic kamu nanti)
    const processed = lines.map((line, i) => ({
      id: i + 1,
      command: line,
      status: "Diproses",
    }));
    setTimeout(() => {
      setResults(processed);
      setLoading(false);
    }, 1000);
  };

  const fetchStock = async () => {
    setLoadingStock(true);
    try {
      const res = await fetch("https://panel.khfy-store.com/api_v3/cek_stock_akrab");
      const text = await res.text();
      // data dari API berbentuk teks, bukan JSON
      const lines = text.split("\n").filter(line => line.trim() !== "");
      const parsed = lines.map((line) => {
        const parts = line.split("|").map(p => p.trim());
        return { kode: parts[0], nama: parts[1], stok: parts[2] };
      });
      setStockData(parsed);
      setFilteredStock(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    const filtered = stockData.filter(
      (item) =>
        item.kode.toLowerCase().includes(value.toLowerCase()) ||
        item.nama.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStock(filtered);
  };

  const openStockModal = async () => {
    setShowStockModal(true);
    await fetchStock();
  };

  const closeStockModal = () => {
    setShowStockModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-4">Request Massal Pembelian</h1>

        <div className="mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows="6"
            placeholder="contoh: beli BPAL1 087812345678&#10;beli BPAL3 081234567890"
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-blue-500"
          ></textarea>
          {error && <p className="text-red-600 mt-1 text-sm">{error}</p>}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleRun}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Mulai Request"}
          </button>

          <button
            onClick={openStockModal}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Cek Stok
          </button>
        </div>

        {/* Hasil */}
        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Hasil:</h2>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="border rounded-lg p-2 bg-gray-100">
                  <p className="text-gray-700">{r.command}</p>
                  <p className="text-sm text-green-700">{r.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === MODAL STOK === */}
      {showStockModal && (
        <div
          onClick={closeStockModal}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()} // biar klik dalam modal gak nutup
            className="bg-white rounded-2xl shadow-lg w-11/12 max-w-2xl p-5 max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold mb-4 text-center">📦 Daftar Stok Produk</h2>

            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full mb-3 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
            />

            {loadingStock ? (
              <p className="text-center text-gray-500">Mengambil data stok...</p>
            ) : (
              <div className="space-y-2 text-sm">
                {filteredStock.map((item, i) => (
                  <div
                    key={i}
                    className="border-b border-gray-200 pb-1 text-gray-800 flex justify-between"
                  >
                    <span className="font-mono">{item.kode}</span>
                    <span className="flex-1 text-center">{item.nama}</span>
                    <span className="text-right">{item.stok}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={closeStockModal}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
