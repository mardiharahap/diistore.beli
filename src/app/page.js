"use client";
import { useState } from "react";

export default function Page() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [stokData, setStokData] = useState([]);
  const [loadingStok, setLoadingStok] = useState(false);

  const handleRun = async () => {
    setError("");
    setResults([]);

    const lines = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length === 0) {
      setError("Masukkan minimal satu perintah pembelian!");
      return;
    }

    setLoading(true);
    const apiKey = "8BCDC5E5-2741-40E6-AFAF-66390970BEDA";

    const requests = lines.map((line) => {
      const parts = line.split(" ");
      const produk = parts[1];
      const no = parts[2];

      if (!produk || !no) {
        return Promise.resolve({
          no: "-",
          produk: "-",
          data: { status: false, message: `Format salah: "${line}"` },
        });
      }

      const reff = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const url = `https://panel.khfy-store.com/api_v2/trx?produk=${produk}&tujuan=${no}&reff_id=${reff}&api_key=${apiKey}`;

      return fetch(url)
        .then((res) => res.json())
        .then((data) => ({ no, produk, data }))
        .catch((err) => ({
          no,
          produk,
          data: { status: false, message: err.message },
        }));
    });

    try {
      const resultsAll = await Promise.all(requests);
      setResults(resultsAll);
    } catch {
      setError("Terjadi kesalahan saat memproses request.");
    }

    setLoading(false);
  };

  // ✅ Ambil stok dari API kamu sendiri (via route)
  const handleCekStok = async () => {
    setLoadingStok(true);
    try {
      const res = await fetch("/api/cek_stock");
      const json = await res.json();

      if (json.ok && Array.isArray(json.data)) {
        setStokData(json.data);
      } else {
        setStokData([]);
      }
    } catch {
      setStokData([]);
    }
    setLoadingStok(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Diistore – Multi Request Panel
        </h1>
        <p className="text-gray-500 mt-2">
          Input beberapa perintah pembelian (pisahkan dengan Enter)
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-3xl p-6 border border-gray-100">
        <label className="block text-gray-700 font-medium mb-2">
          Daftar Pembelian
        </label>
        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Contoh:\nbeli BPAL1 087882724621\nbeli BPAL3 083184857772`}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="italic text-sm text-[#A0522D] mt-2">
          Contoh format: <span className="font-mono">beli BPAL1 0878xxxxxxx</span>
        </p>

        {/* Tombol aksi */}
        <div className="flex justify-end items-center gap-3 mt-4">
          <button
            onClick={handleCekStok}
            disabled={loadingStok}
            className={`px-5 py-2.5 rounded-lg font-semibold text-white transition ${
              loadingStok
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loadingStok ? "Memuat..." : "Cek Stok"}
          </button>

          <button
            onClick={handleRun}
            disabled={loading}
            className={`px-6 py-2.5 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Memproses..." : "Mulai Request"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg mt-4">
            {error}
          </div>
        )}

        {/* ✅ Daftar Stok */}
        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Stok Produk</h2>
          {loadingStok ? (
            <div className="text-blue-600 font-medium animate-pulse py-3 text-center">
              Memuat stok...
            </div>
          ) : stokData.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto font-mono text-sm text-gray-700 whitespace-pre-wrap">
              {stokData.map((item, i) => (
                <div
                  key={i}
                  className={`border-b py-1 ${
                    item.sisa_slot === 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {`${item.type} | ${item.nama} | ${item.sisa_slot} unit`}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-center">
              Klik “Cek Stok” untuk melihat data stok terkini.
            </p>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 uppercase text-xs text-gray-600">
                <tr>
                  <th className="px-4 py-3 border-b">No. HP</th>
                  <th className="px-4 py-3 border-b">Produk</th>
                  <th className="px-4 py-3 border-b">Status</th>
                  <th className="px-4 py-3 border-b">Pesan</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-2 font-medium">{item.no}</td>
                    <td className="px-4 py-2">{item.produk}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        item.data?.status ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.data?.status ? "Sukses" : "Gagal"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.data?.message || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Loading Info */}
        {loading && (
          <div className="text-center text-blue-600 font-medium mt-4 animate-pulse">
            Sedang memproses semua pembelian...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-sm text-gray-400 mt-10">
        © {new Date().getFullYear()} | Diistore API Panel
      </div>
    </div>
  );
}
