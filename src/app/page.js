"use client";
import { useState } from "react";

export default function Page() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError("Terjadi kesalahan saat memproses request.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-blue-700 drop-shadow-sm">
          Diistore Multi Request Panel
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Input beberapa perintah pembelian <br className="sm:hidden" />
          <span className="text-gray-400">(pisahkan dengan Enter)</span>
        </p>
      </div>

      {/* Card */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
        <label className="block text-gray-700 font-semibold mb-3 text-lg">
          Daftar Pembelian
        </label>
        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Contoh:\nbeli BPAL1 087882724621\nbeli BPAL3 083184857772`}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        {/* Tombol */}
        <div className="flex justify-end mt-5">
          <button
            onClick={handleRun}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl font-semibold text-white text-sm sm:text-base shadow-md transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {loading ? "Memproses..." : "Mulai Request"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-xl mt-5 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Loading Info */}
        {loading && (
          <div className="text-center text-blue-600 font-medium mt-5 animate-pulse">
            Sedang memproses semua pembelian...
          </div>
        )}

        {/* Hasil */}
        {results.length > 0 && (
          <div className="mt-6 overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-blue-100 text-blue-800 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 border-b">No. HP</th>
                  <th className="px-4 py-3 border-b">Produk</th>
                  <th className="px-4 py-3 border-b">Status</th>
                  <th className="px-4 py-3 border-b">Pesan</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-none hover:bg-blue-50/40 transition"
                  >
                    <td className="px-4 py-2 font-medium">{item.no}</td>
                    <td className="px-4 py-2">{item.produk}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        item.data?.status
                          ? "text-green-600"
                          : "text-red-600"
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
      </div>

      {/* Footer */}
      <div className="text-sm text-gray-400 mt-10">
        © {new Date().getFullYear()} |{" "}
        <span className="font-semibold text-blue-600">Diistore API Panel</span>
      </div>
    </div>
  );
}
