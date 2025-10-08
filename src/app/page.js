"use client";
import { useState, useEffect, useCallback } from "react";

export default function Page() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [stokData, setStokData] = useState([]);
  const [loadingStok, setLoadingStok] = useState(false);

  const [preorder, setPreorder] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupDaftar, setPopupDaftar] = useState("");
  const [popupJam, setPopupJam] = useState("");
  const [popupMenit, setPopupMenit] = useState("");
  const [popupDetik, setPopupDetik] = useState("");

  const apiKey = "8BCDC5E5-2741-40E6-AFAF-66390970BEDA";

  const normalizeLines = (text) =>
    Array.from(
      new Set(
        (text || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      )
    );

  const handleRun = useCallback(
    async (customInput = null) => {
      setError("");
      setResults([]);

      const raw = customInput ?? inputText;
      const lines = normalizeLines(raw);
      if (lines.length === 0) {
        setError("Masukkan minimal satu perintah pembelian!");
        return;
      }

      setLoading(true);

      const requests = lines.map((line) => {
        const parts = line.split(" ").filter(Boolean);
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
        const url = `https://panel.khfy-store.com/api_v2/trx?produk=${encodeURIComponent(
          produk
        )}&tujuan=${encodeURIComponent(no)}&reff_id=${reff}&api_key=${apiKey}`;

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
      } finally {
        setLoading(false);
      }
    },
    [inputText, apiKey]
  );

  const handleCekStok = async () => {
    setLoadingStok(true);
    try {
      const res = await fetch("/api/cek_stock");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) setStokData(json.data);
      else setStokData([]);
    } catch {
      setStokData([]);
    } finally {
      setLoadingStok(false);
    }
  };

  const openPreorderPopup = () => {
    setPopupDaftar(inputText.trim() || (preorder?.daftar ?? ""));
    if (preorder?.jadwal) {
      const d = preorder.jadwal;
      setPopupJam(String(d.getHours()).padStart(2, "0"));
      setPopupMenit(String(d.getMinutes()).padStart(2, "0"));
      setPopupDetik(String(d.getSeconds()).padStart(2, "0"));
    } else {
      setPopupJam("");
      setPopupMenit("");
      setPopupDetik("");
    }
    setShowPopup(true);
  };

  const handleSavePreorder = () => {
    const daftarTrimmed = popupDaftar.trim();
    if (!daftarTrimmed) {
      alert("Daftar pembelian kosong!");
      return;
    }

    if (popupJam === "" || popupMenit === "" || popupDetik === "") {
      alert("Lengkapi jam, menit, dan detik!");
      return;
    }

    const hh = Number(popupJam);
    const mm = Number(popupMenit);
    const ss = Number(popupDetik);

    if (
      Number.isNaN(hh) ||
      Number.isNaN(mm) ||
      Number.isNaN(ss) ||
      hh < 0 ||
      hh > 23 ||
      mm < 0 ||
      mm > 59 ||
      ss < 0 ||
      ss > 59
    ) {
      alert("Jam/menit/detik tidak valid!");
      return;
    }

    const now = new Date();
    let jadwal = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hh,
      mm,
      ss,
      0
    );

    if (jadwal <= now) {
      const ok = window.confirm(
        "Waktu tersebut sudah lewat hari ini. Simpan untuk besok jam yang sama?"
      );
      if (ok) jadwal.setDate(jadwal.getDate() + 1);
      else return;
    }

    if (preorder) {
      const choice = window.confirm(
        `Sudah ada preorder aktif pukul ${preorder.jadwal.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}.\nOK = tambah daftar ke jadwal sama, Cancel = ganti.`
      );

      if (choice) {
        const merged = normalizeLines(preorder.daftar)
          .concat(normalizeLines(daftarTrimmed))
          .filter(Boolean);
        const unique = Array.from(new Set(merged));
        setPreorder({ ...preorder, daftar: unique.join("\n") });
        setShowPopup(false);
        alert("✅ Daftar ditambahkan ke preorder aktif.");
        return;
      }
    }

    setPreorder({ daftar: daftarTrimmed, jadwal });
    setShowPopup(false);
    alert(
      `✅ Preorder disimpan. Akan dikirim pukul ${jadwal.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`
    );
  };

  const handleCancelPreorder = () => {
    if (!preorder) return;
    const ok = window.confirm("Batalkan preorder yang aktif?");
    if (ok) {
      setPreorder(null);
      alert("Preorder dibatalkan.");
    }
  };

  useEffect(() => {
    if (!preorder) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = preorder.jadwal - now;
      if (Math.abs(diff) <= 700) {
        handleRun(preorder.daftar)
          .then(() =>
            alert(
              `✅ Preorder pukul ${preorder.jadwal.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })} berhasil dikirim.`
            )
          )
          .catch(() =>
            alert(
              `❌ Gagal mengirim preorder pukul ${preorder.jadwal.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}.`
            )
          )
          .finally(() => setPreorder(null));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [preorder, handleRun]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">💎 Diistore Panel</h1>
        <p className="text-gray-500 mt-2">
          Jalankan beberapa perintah pembelian secara paralel
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-2xl w-full max-w-3xl p-8 border border-gray-100">
        <label className="block text-gray-700 font-semibold mb-2 text-lg">
          Daftar Pembelian
        </label>
        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Contoh:\nbeli BPAL1 087882724621\nbeli BPAL3 083184857772`}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="italic text-sm text-gray-500 mt-2">
          Format: <span className="font-mono">beli BPAL1 0878xxxxxxx</span>
        </p>

        <div className="flex justify-end items-center gap-3 mt-5 flex-wrap">
          <button
            onClick={handleCekStok}
            disabled={loadingStok}
            className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-all ${loadingStok
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
              }`}
          >
            {loadingStok ? "Memuat..." : "Cek Stok"}
          </button>

          <button
            onClick={openPreorderPopup}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all"
          >
            Preorder
          </button>

          <button
            onClick={() => handleRun()}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Memproses..." : "Mulai Request"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mt-5 text-center">
            {error}
          </div>
        )}

        {/* Stok Produk */}
        <div className="mt-6 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Stok Produk
          </h2>
          {loadingStok ? (
            <div className="text-blue-600 font-medium animate-pulse py-3 text-center">
              Memuat stok...
            </div>
          ) : stokData.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto font-mono text-sm text-gray-700 whitespace-pre-wrap">
              {stokData.map((item, i) => (
                <div
                  key={i}
                  className={`border-b py-1 ${item.sisa_slot === 0 ? "text-red-600" : "text-green-600"
                    }`}
                >
                  {`${item.type} | ${item.nama} | ${item.sisa_slot} unit`}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-center">
              Klik “Cek Stok” untuk melihat data stok terkini.
            </p>
          )}
        </div>

        {/* Hasil Request */}
        {results.length > 0 && (
          <div className="mt-6 overflow-x-auto border border-gray-200 rounded-xl">
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
                  <tr
                    key={i}
                    className="border-b hover:bg-gray-50 transition-all"
                  >
                    <td className="px-4 py-2 font-medium">{item.no}</td>
                    <td className="px-4 py-2">{item.produk}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${item.data?.status
                        ? "text-emerald-600"
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

        {preorder && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg mt-5 text-sm flex justify-between items-center">
            <div>
              ⏰ Preorder aktif:{" "}
              <span className="font-mono">
                {preorder.jadwal.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>{" "}
              ({normalizeLines(preorder.daftar).length} item)
            </div>
            <button
              onClick={handleCancelPreorder}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-lg animate-fadeIn">
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Buat / Edit Preorder
            </h2>

            <label className="text-sm text-gray-600">
              Daftar pembelian (satu per baris)
            </label>
            <textarea
              rows={6}
              value={popupDaftar}
              onChange={(e) => setPopupDaftar(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 mt-2"
            />

            <div className="flex gap-2 mt-4">
              <input
                type="number"
                min="0"
                max="23"
                value={popupJam}
                onChange={(e) => setPopupJam(e.target.value)}
                placeholder="Jam"
                className="w-1/3 border p-2 rounded text-center focus:ring-2 focus:ring-purple-300"
              />
              <input
                type="number"
                min="0"
                max="59"
                value={popupMenit}
                onChange={(e) => setPopupMenit(e.target.value)}
                placeholder="Menit"
                className="w-1/3 border p-2 rounded text-center focus:ring-2 focus:ring-purple-300"
              />
              <input
                type="number"
                min="0"
                max="59"
                value={popupDetik}
                onChange={(e) => setPopupDetik(e.target.value)}
                placeholder="Detik"
                className="w-1/3 border p-2 rounded text-center focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleSavePreorder}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-400 mt-10">
        © {new Date().getFullYear()} Diistore API Panel
      </div>
    </div>
  );
}
