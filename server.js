const express = require('express');
const https = require('https');
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const OPENROUTER_KEY = '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';
const TARGET_MODEL = 'anthropic/claude-3.5-sonnet';

async function callOpenRouter(messages, temperature = 0.5) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: TARGET_MODEL,
            messages: messages,
            temperature: temperature
        });
        const options = {
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + OPENROUTER_KEY,
                'Content-Type': 'application/json'
            }
        };
        const request = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => { body += d; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content.trim());
                    } else { reject(new Error('API Hatası: ' + body)); }
                } catch (e) { reject(e); }
            });
        });
        request.on('error', (e) => reject(e));
        request.write(postData);
        request.end();
    });
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images, userInfo } = req.body; 
        let imageContent = [];
        if (images && images.length > 0) {
            images.forEach(img => {
                imageContent.push({ type: 'image_url', image_url: { url: img } });
            });
        }

        const name = userInfo?.name || "Evladım";
        const age = userInfo?.age || "bilinmeyen";
        const gender = userInfo?.gender || "bilinmeyen";
        const birthDate = userInfo?.birthDate || "bilinmeyen";
        const ay = new Date().toLocaleDateString('tr-TR', { month: 'long' });

        // --- 1. PARÇA: NUMEROLOJİ VE KAHVE FALI MANTIĞI ---
        if (message.includes('numeroloji') || message.includes('sayı falı')) {
            const numPrompt = `Sen 40 yıldır numeroloji bakan Ayşe Teyzesin. 1984'ten beri bu işi yapıyorsun.
            Kullanıcı: ${name}, Doğum: ${birthDate}, Yaş: ${age}.
            VERİ SETİN: 1-Lider, 2-Diplomat, 3-Sanatkar, 4-Çalışkan, 5-Özgür, 6-Aile, 7-Dana(Hikmet), 8-Para, 9-Akıl Hocası.
            USTA SAYILAR: 11-Sezgi, 22-Mimar, 33-Merhamet.
            KURAL: Direkt fala başla, en az 15 cümle, samimi teyze dili kullan.`;
            const cevap = await callOpenRouter([{ role: 'system', content: numPrompt }, { role: 'user', content: 'Numeroloji falı bak' }], 0.9);
            return res.json({ text: cevap });
        }

        if (message.includes('Kahve')) {
            const kahvePrompt = `Sen 40 yıldır kahve falı bakan Ayşe Teyzesin. 
            VERİ SETİN (HAYVANLAR): Kuş(müjde), Yılan(düşman), Kartal(güç), Balık(para), Kedi(sahte dost), Köpek(sadık).
            VERİ SETİN (OBJELER): Ev(taşınma), Araba(yol), Para(kazanç), Yüzük(izdivaç), Anahtar(fırsat).
            KURAL: Sağ taraf pozitif, sol geçmiş, dip gelecek. En az 20 cümle kur.`;
            const cevap = await callOpenRouter([{ role: 'system', content: kahvePrompt }, { role: 'user', content: [...imageContent, { type: 'text', text: message }] }], 1.0);
            return res.json({ text: cevap });
        }

        // --- 2. PARÇA: EL FALI VE TAROT MANTIĞI ---
        if (message.includes('El Falı')) {
            const elPrompt = `Sen 40 yıldır el falı bakan Ayşe Teyzesin. 
            VERİ SETİN: Hayat Çizgisi, Kalp Çizgisi, Kader Çizgisi, Akıl Çizgisi. 
            PARMAKLAR: Baş parmak(irade), Şahadet(lider), Orta(sorumluluk).
            KURAL: En az 20 cümle, yaş tahmini ver (35 yaş kırılması vb.).`;
            const cevap = await callOpenRouter([{ role: 'system', content: elPrompt }, { role: 'user', content: [...imageContent, { type: 'text', text: message }] }], 1.0);
            return res.json({ text: cevap });
        }

        if (message.toLowerCase().includes('tarot')) {
            const tarotPrompt = `Sen 40 yıldır tarot bakan Ayşe Teyzesin.
            VERİ SETİN: 0-Deli, 1-Sihirbaz, 2-Başrahibe... 10-Kader Çarkı... 13-Ölüm... 16-Kule... 21-Dünya.
            KÜÇÜK ARKANA: Asalar(İş), Kupalar(Aşk), Kılıçlar(Zihin), Tılsımlar(Para).
            KURAL: Geçmiş-Şimdi-Gelecek açılımı yap, en az 25 cümle yaz.`;
            const cevap = await callOpenRouter([{ role: 'system', content: tarotPrompt }, { role: 'user', content: message }], 0.9);
            return res.json({ text: cevap });
        }

        // --- 3. PARÇA: BURÇLAR VE RÜYA TABİRİ MANTIĞI ---
        if (/burc|burç/i.test(message)) {
            const burcPrompt = `Sen 40 yıldır astroloji yapan Ayşe Teyzesin. 
            VERİ SETİN: 12 Burç (Koç'tan Balık'a), Gezegenler (Venüs-Aşk, Mars-Enerji, Jüpiter-Şans, Satürn-Ders).
            KURAL: Şu an ${ay} ayındayız. Aşk, Kariyer, Para, Sağlık ayrı yorumla. En az 18 cümle.`;
            const cevap = await callOpenRouter([{ role: 'system', content: burcPrompt }, { role: 'user', content: message }], 0.9);
            return res.json({ text: cevap });
        }

        if (/ruya|rüya/i.test(message)) {
            const ruyaPrompt = `Sen 40 yıldır rüya yorumlayan Ayşe Teyzesin. 
            VERİ SETİN: Yılan, Köpek, Kedi, Kuş, At, Bebek, Ölüm, Deniz, Yağmur, Altın, Araba.
            KURAL: Psikolojik ve geleneksel tabir yap, en az 20 cümle yaz.`;
            const cevap = await callOpenRouter([{ role: 'system', content: ruyaPrompt }, { role: 'user', content: message }], 0.9);
            return res.json({ text: cevap });
        }

        // Varsayılan Yanıt
        return res.json({ text: `${name} evladım, ne fala bakmamı istersin? Kahve, El, Tarot, Burç, Rüya yoksa Numeroloji mi?` });

    } catch (error) {
        console.error("Hata:", error);
        res.status(500).json({ text: "Kuzum bir nazar değdi, tekrar dene." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ayşe Teyze hazır!`));
