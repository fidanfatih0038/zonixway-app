cat << 'EOF' > server.js
const express = require('express');
const https = require('https');
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const OPENROUTER_KEY = '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';

async function callOpenRouter(messages, temperature = 0.5) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: 'anthropic/claude-3-haiku',
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
                    } else { reject(new Error('API Error')); }
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
        const { message, images } = req.body;
        let imageContent = [];
        if (images && images.length > 0) {
            images.forEach(img => {
                imageContent.push({ type: 'image_url', image_url: { url: img } });
            });
        }

        const isKahveFali = message.includes('Kahve');
        const isElFali = message.includes('El Falı');
        const isTarot = message.includes('Tarot') || message.includes('tarot');
        const isBurc = message.includes('Burc') || message.includes('Burç') || message.includes('burc') || message.includes('burç');
        const isRuya = message.includes('Ruya') || message.includes('Rüya') || message.includes('ruya') || message.includes('rüya');

        // TAROT FALI - KART ISIMLERIYLE
        if (isTarot) {
            const tarotPrompt = `Sen deneyimli ve gizemli bir Tarot Ustadasın. Profesyonel tarot falı bakarsın.

TAROT OKUMA KURALLARI:
1. Kullanıcının sectigi 3 kartı mesajdan tespit et (ornek: The Fool, The Lovers, Death)
2. Her kartı AYRI AYRI ve DETAYLI yorumla:
   - Kartın genel anlamı
   - Duz veya ters pozisyonda ne ifade ettigi
   - Kisisel hayata etkisi
3. 3 kartın birlikte olusturduğu GENEL MESAJI yorumla:
   - Gecmis-Simdi-Gelecek iliskisi
   - Kartların birbirini nasıl tamamladıgı
   - Kisiye ozel yonlendirme
4. UZUN ve DETAYLI yorum yap, her kart icin en az 3-4 cumle
5. "Olabilir, belki" degil "bu kart gosteriyor ki, bu anlama geliyor" gibi NET ifadeler kullan

Kullanıcının mesajı: ${message}`;

            const hamTarot = await callOpenRouter([
                { role: 'system', content: tarotPrompt },
                { role: 'user', content: message }
            ], 0.9);

            const editorPrompt = `Sen usta bir editorsun. "Sevgili evladım," diye basla. Tarotcunun gizemli ve kesin dilini koru. Uzun ve akıcı paragraflar yap. Sonuna imza atma.`;
            
            const temizTarot = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: 'Ham Tarot: ' + hamTarot }
            ], 0.4);

            return res.json({ text: temizTarot });
        }

        // BURC YORUMU - GERCEK ASTROLOJIK VERILERLE
        if (isBurc) {
            const bugunTarih = new Date().toLocaleDateString('tr-TR');
            
            const burcPrompt = `Sen profesyonel bir Astrologsun. GERCEK astrolojik verilere gore yorum yaparsın.

ASTROLOJI KURALLARI:
1. Bugun ${bugunTarih} tarihindeki GERCEK gezegen hareketlerini dusun
2. Kullanıcının burcunu tespit et ve o burca ozel yorum yap
3. Guncel gezegen konumlarını belirt:
   - Hangi gezegen hangi burctaysa onu soyle (ornek: "Venus simdi Boga burcunda")
   - Retrograd durumları (ornek: "Merkur retrograd surecinde")
   - Onemli acılar ve kavusmalar
4. Bu gezegen hareketlerinin kullanıcının burcuna SOMUT etkileri:
   - Ask hayatına etkisi (Venus, Mars konumları)
   - Kariyer ve para (Jupıter, Saturn konumları)
   - Enerji seviyesi (Gunes, Ay konumları)
5. UZUN ve DETAYLI yorum yap
6. "Olabilir, belki" degil "bu gerceklesiyor, yasayacaksın, gelecek" gibi NET ifadeler kullan

Kullanıcının mesajı: ${message}`;

            const hamBurc = await callOpenRouter([
                { role: 'system', content: burcPrompt },
                { role: 'user', content: message }
            ], 0.9);

            const editorPrompt = `Sen usta bir editorsun. "Sevgili evladım," diye basla. Astrologun bilimsel ama gizemli dilini koru. Gezegen isimlerini ve astrolojik terimleri koru. Uzun paragraflar yap. Sonuna imza atma.`;
            
            const temizBurc = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: 'Ham Burc: ' + hamBurc }
            ], 0.4);

            return res.json({ text: temizBurc });
        }

        // RUYA TABIRI
        if (isRuya) {
            const ruyaPrompt = `Sen bilge bir Ruya Tabircisisin. Ruyaları cok iyi yorumlarsın.
            KURAL 1: Ruyada gecen her onemli sembolu tek tek ac ve yorumla.
            KURAL 2: Ruyaların psikolojik ve manevi anlamlarını DETAYLI anlat.
            KURAL 3: Bu ruyanın kisi icin ne anlama geldigini NET ve UZUN bir sekilde ac.
            KURAL 4: "Olabilir, muhtemelen" degil "bu ruya soyle yorumlanır, bu anlama gelir" gibi kesin konus.`;

            const hamRuya = await callOpenRouter([
                { role: 'system', content: ruyaPrompt },
                { role: 'user', content: message }
            ], 0.9);

            const editorPrompt = `Sen usta bir editorsun. "Sevgili evladım," diye basla. Ruya tabircisinin bilge ve net dilini koru. Uzun paragraflar yap. Sonuna imza atma.`;
            
            const temizRuya = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: 'Ham Ruya: ' + hamRuya }
            ], 0.4);

            return res.json({ text: temizRuya });
        }

        // KAHVE FALI (ORJINAL KODUNUZ)
        if (isKahveFali) {
            const checkPrompt = `Bu gorselde KAHVE TELVESI var mı? Fincan ici, fincan dibi, tabakta telve, kahve kalıntısı gibi KAHVEYE AIT bir sey goruyorsan "EVET" yaz. Hicbir kahve unsuru yoksa "HAYIR" yaz. Sadece tek kelime cevap ver.`;

            const guardResponse = await callOpenRouter([
                { role: 'system', content: checkPrompt },
                { role: 'user', content: imageContent }
            ], 0.1);

            const ilkKontrol = guardResponse.toUpperCase().trim();

            if (ilkKontrol.includes('HAYIR') || !ilkKontrol.includes('EVET')) {
                return res.json({ text: 'Lutfen gecerli bir kahve fincanı veya telve fotografı yukleyiniz.' });
            }

            const doubleCheckPrompt = `KRITIK KONTROL: Bu gorsel kahve falı icin uygun mu? Telve, fincan dibi, kahve kalıntısı gibi KAHVE UNSURLARI var mı? Varsa "DEVAM", yoksa "DUR" yaz.`;

            const doubleCheck = await callOpenRouter([
                { role: 'system', content: doubleCheckPrompt },
                { role: 'user', content: imageContent }
            ], 0.1);

            const ikinciKontrol = doubleCheck.toUpperCase().trim();

            if (ikinciKontrol.includes('DUR') || !ikinciKontrol.includes('DEVAM')) {
                return res.json({ text: 'Lutfen gecerli bir kahve fincanı veya telve fotografı yukleyiniz.' });
            }

            const kahinPrompt = `Sen kadim ve cok dobra bir Falcı Bacısın. 
            KURAL 1: "Olabilir, gelebilir, belki" gibi ihtimal bildiren ekleri ASLA kullanma.
            KURAL 2: "Var, olacak, cıkıyor, net goruyorum" gibi kesin ve net yargılarla konus.
            KURAL 3: En az 6 somut figuru (kus, yol, balık, dag vb.) fincanın konumuna gore (sagda, solda, dipte) isimlendir ve UZUNCA yorumla.`;

            const hamFal = await callOpenRouter([
                { role: 'system', content: kahinPrompt },
                { role: 'user', content: [...imageContent, { type: 'text', text: message }] }
            ], 1.0);

            const editorPrompt = `Sen usta bir editorsun. "Sevgili evladım," diye basla. Falcının o net ve dobra dilini bozma, ihtimal eklerini temizle. Uzun ve akıcı bir paragraf yap. Sonuna asla imza atma.`;
            
            const temizFal = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: 'Ham Fal: ' + hamFal }
            ], 0.4);

            return res.json({ text: temizFal });
        }

        // EL FALI (ORJINAL KODUNUZ)
        if (isElFali) {
            const checkPrompt = `Bu gorselde ACIK BIR INSAN ELI var mı? Avuc ici, parmaklar, el cizgileri goruyorsan "EVET" yaz. El yoksa "HAYIR" yaz. Sadece tek kelime cevap ver.`;

            const guardResponse = await callOpenRouter([
                { role: 'system', content: checkPrompt },
                { role: 'user', content: imageContent }
            ], 0.1);

            const ilkKontrol = guardResponse.toUpperCase().trim();

            if (ilkKontrol.includes('HAYIR') || !ilkKontrol.includes('EVET')) {
                return res.json({ text: 'Lutfen gecerli bir el fotografı yukleyiniz.' });
            }

            const doubleCheckPrompt = `KRITIK KONTROL: Bu gorsel el falı icin uygun mu? INSAN ELI, avuc ici, el cizgileri var mı? Varsa "DEVAM", yoksa "DUR" yaz.`;

            const doubleCheck = await callOpenRouter([
                { role: 'system', content: doubleCheckPrompt },
                { role: 'user', content: imageContent }
            ], 0.1);

            const ikinciKontrol = doubleCheck.toUpperCase().trim();

            if (ikinciKontrol.includes('DUR') || !ikinciKontrol.includes('DEVAM')) {
                return res.json({ text: 'Lutfen gecerli bir el fotografı yukleyiniz.' });
            }

            const kahinPrompt = `Sen kadim ve cok dobra bir Falcı Bacısın. 
            KURAL 1: "Olabilir, gelebilir, belki" gibi ihtimal bildiren ekleri ASLA kullanma.
            KURAL 2: "Var, olacak, cıkıyor, net goruyorum" gibi kesin ve net yargılarla konus.
            KURAL 3: En az 6 somut figuru (kus, yol, balık, dag vb.) fincanın konumuna gore (sagda, solda, dipte) isimlendir ve UZUNCA yorumla.`;

            const hamFal = await callOpenRouter([
                { role: 'system', content: kahinPrompt },
                { role: 'user', content: [...imageContent, { type: 'text', text: message }] }
            ], 1.0);

            const editorPrompt = `Sen usta bir editorsun. "Sevgili evladım," diye basla. Falcının o net ve dobra dilini bozma, ihtimal eklerini temizle. Uzun ve akıcı bir paragraf yap. Sonuna asla imza atma.`;
            
            const temizFal = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: 'Ham Fal: ' + hamFal }
            ], 0.4);

            return res.json({ text: temizFal });
        }

        res.json({ text: 'Lutfen fal turunu belirtiniz (Kahve Falı, El Falı, Tarot, Burc, Ruya)' });

    } catch (e) {
        res.status(500).json({ error: 'Sistem mesgul.' });
    }
});

app.listen(3000);
EOF
