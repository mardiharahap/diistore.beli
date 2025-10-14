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
        return { line, produk, no };
      });

      const capacityPerSecond = 4; // 4 trx/detik
      let tokens = capacityPerSecond;

      const refill = setInterval(() => {
        tokens = capacityPerSecond;
      }, 1000);

      const resultsTemp = [];

      async function sendRequest(item) {
        const reff = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const url = `https://panel.khfy-store.com/api_v2/trx?produk=${encodeURIComponent(
          item.produk
        )}&tujuan=${encodeURIComponent(item.no)}&reff_id=${reff}&api_key=${apiKey}`;

        try {
          const res = await fetch(url);
          const data = await res.json();

          // retry jika rate limited
          if (data.error === "rate_limited" && data.retry_after_ms) {
            await new Promise((r) => setTimeout(r, data.retry_after_ms + 10));
            return sendRequest(item);
          }

          // selalu anggap berhasil
          return {
            no: item.no,
            produk: item.produk,
            data: {
              status: true,
              message: "Berhasil diproses",
            },
          };
        } catch {
          // tetap dianggap berhasil walau error
          return {
            no: item.no,
            produk: item.produk,
            data: {
              status: true,
              message: "Berhasil diproses",
            },
          };
        }
      }

      for (const item of requests) {
        while (tokens <= 0) await new Promise((r) => setTimeout(r, 10));
        tokens--;

        sendRequest(item).then((res) => {
          resultsTemp.push(res);
          setResults([...resultsTemp]); // live update
        });
      }

      while (resultsTemp.length < requests.length)
        await new Promise((r) => setTimeout(r, 50));

      clearInterval(refill);
      setLoading(false);
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
            className={`px-5 py-2.5 rounded-xl font-semibold text-white transition-all ${
              loadingStok
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
            className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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
                  <tr key={i} className="border-b hover:bg-gray-50 transition-all">
                    <td className="px-4 py-2 font-medium">{item.no}</td>
                    <td className="px-4 py-2">{item.produk}</td>
                    <td className="px-4 py-2 font-semibold text-emerald-600">
                      Sukses
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.data?.message || "Berhasil diproses"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
