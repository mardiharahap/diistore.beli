import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = "8BCDC5E5-2741-40E6-AFAF-66390970BEDA";

    const requests = [
        // BPAL1
        { no: "087882724621", produk: "BPAL1" },
        { no: "081882878650", produk: "BPAL1" },
        { no: "087823524585", produk: "BPAL1" },
        { no: "085959635168", produk: "BPAL1" },
        { no: "083867258658", produk: "BPAL1" },
        { no: "083874902757", produk: "BPAL1" },
        { no: "083159707199", produk: "BPAL1" },
        { no: "083844606476", produk: "BPAL1" },
        { no: "081993638305", produk: "BPAL1" },
        { no: "083844952728", produk: "BPAL1" },
        { no: "083824540658", produk: "BPAL1" },
        { no: "083177242774", produk: "BPAL1" },
        { no: "081957427944", produk: "BPAL1" },
        { no: "085941929038", produk: "BPAL1" },
        { no: "087785067882", produk: "BPAL1" },
        { no: "083846573200", produk: "BPAL1" },
        { no: "083165851007", produk: "BPAL1" },
        { no: "083867595134", produk: "BPAL1" },

        // BPAL3
        { no: "083138819140", produk: "BPAL3" },
        { no: "083150923003", produk: "BPAL3" },
        { no: "083836957424", produk: "BPAL3" },

        // BPAL5
        { no: "083892380273", produk: "BPAL5" },
        { no: "087756943641", produk: "BPAL5" },
        { no: "083896618168", produk: "BPAL5" },
        { no: "083129547029", produk: "BPAL5" },
        { no: "083894892702", produk: "BPAL5" },


        // BPAL7
        { no: "083183153845", produk: "BPAL7" },
        { no: "083896002521", produk: "BPAL7" },
        { no: "083823284377", produk: "BPAL7" },
        { no: "083834861626", produk: "BPAL7" },
        { no: "083896014787", produk: "BPAL7" },
        { no: "083166130912", produk: "BPAL7" },
        { no: "081944523623", produk: "BPAL7" },
        { no: "087888324610", produk: "BPAL7" },
        { no: "08388070393", produk: "BPAL7" },
        { no: "083163816339", produk: "BPAL7" },
        { no: "083852539593", produk: "BPAL7" },
        { no: "083839701699", produk: "BPAL7" },
        { no: "083840092288", produk: "BPAL7" },
        { no: "083838354032", produk: "BPAL7" },

        // BPAL9
        { no: "083111463927", produk: "BPAL9" },
        { no: "083175076577", produk: "BPAL9" },

        // BPAL11
        { no: "083165488580", produk: "BPAL11" },
        { no: "083191098123", produk: "BPAL11" },
        { no: "083135250868", produk: "BPAL11" },
        { no: "083183856036", produk: "BPAL11" },
        { no: "083129232348", produk: "BPAL11" },
        { no: "083867127155", produk: "BPAL11" },
        { no: "083822697022", produk: "BPAL11" },


        // BPAL13
        { no: "087765487061", produk: "BPAL13" },
        { no: "083862247780", produk: "BPAL13" },
        { no: "083871694828", produk: "BPAL13" },

        // BPAL15
        { no: "087875923186", produk: "BPAL15" },

        // BPAL19
        { no: "083835969176", produk: "BPAL19" },
        { no: "083878954288", produk: "BPAL19" },
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
