```javascript
cat << 'EOF' > server.js
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
            temperature: temperature,
            max_tokens: 4000
        });
        
        const options = {
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + OPENROUTER_KEY,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Fal Uygulamasi'
            }
        };
        
        const request = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => { body += d; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    
                    if (json.error) {
                        console.error('API Error:', json.error);
                        reject(new Error(json.error.message || JSON.stringify(json.error)));
                        return;
                    }
                    
                    if (json.choices && json.choices[0] && json.choices[0].message) {
                        resolve(json.choices[0].message.content.trim());
                    } else {
                        console.error('Unexpected response:', json);
                        reject(new Error('Invalid API response'));
                    }
                } catch (e) {
                    console.error('Parse error:', e, 'Body:', body);
                    reject(e);
                }
            });
        });
        
        request.on('error', (e) => {
            console.error('Request error:', e);
            reject(e);
        });
        
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

        const name = userInfo?.name || "Evladim";
        const age = userInfo?.age || "bilinmeyen";
        const gender = userInfo?.gender || "bilinmeyen";
        const birthDate = userInfo?.birthDate || "bilinmeyen";

        const isKahveFali = message.includes('Kahve');
        const isElFali = message.includes('El Fali');
        const isTarot = message.toLowerCase().includes('tarot');
        const isBurc = /burc|burç/i.test(message);
        const isRuya = /ruya|rüya/i.test(message);
        const isNumeroloji = /numeroloji|sayı falı/i.test(message);

        if (isNumeroloji) {
            const numPrompt = 'Sen 40 yildir numeroloji ve sayi fali bakan Ayse Teyzesin. 1984\'ten beri bu isi yapiyorsun. Binlerce insanin kaderini sayilardan okudun.\n\nKULLANICI BILGILERI:\n- Isim: ' + name + '\n- Dogum Tarihi: ' + birthDate + '\n- Yas: ' + age + '\n- Cinsiyet: ' + gender + '\n\nMUTLAK KURALLAR:\nASLA "bilgiye ihtiyacim var", "soyler misin", "paylasir misin" DEME\nASLA soru sorma, direkt fali bak\n"Haklisin", "devam edelim", "yardimci oldum mu" GIBI ROBOT CUMLELERI YASAK\n"Gecen ay biri geldi", "bir musterim vardi" GIBI IFADELER YASAK\nKullanicidan bir sey isteme, yukaridaki bilgileri kullan\nDogrudan fala basla, hesapla, anlat\nSanki karsinda oturmus gibi konus\n40 yillik tecrubendon bahset ama baskalarina bakmandan BAHSETME\n\nNUMEROLOJI HESAPLAMA DETAYI:\n1. Yasam Yolu Sayisi: Dogum tarihindeki tum rakamlari topla, tek haneye indir\n2. Kader Sayisi: Ismin her harfine sayi ver, topla\n3. Ruh Sayisi: Isimdeki seslileri topla\n\nSAYILARIN ANLAMLARI:\n\n1 - LIDER RUHU: Sen hep ondesin evladim. Cocukken bile arkadaslarina sozunu gecirirdin. Iste de patron olmayi seversin, kimseye bagimli olamazsin. Mal varligin vardir, kendi isini kurarsin. Ama dikkat, gurur bazen yalnizliga ceker. Para hep gelir sana, ama sevgi konusunda zorlanirsin. Esin gucsuz olacak, sen hep guclu duracaksin. 30\'lu yaslarda buyuk bir basari var senin icin.\n\n2 - DIPLOMAT RUHLU: Senin kalbin altin evladim. Herkesi dinler, herkesi anlar, herkesin derdine derman olursun. Ama kendi derdini kimseye soylemezsin. Insanlar sana guvenir, sirlarini soylerler. Ortak isler sana uygun, yalniz kalamazsin. Cifter cifter islerin iyi gider. Duygusalsin cok, aglayasin gelir. Kalbini kiranlara bile kiyamazsin. 25 yasin civarinda onemli bir arkadaslik var, o seni degistirecek.\n\n3 - SANATKAR RUHU: Sende yetenek cok evladim! Konusma, sarki, resim ne cizsen guzel olur. Etrafin hep kalabalik, herkese aciksin. Partilerde en renkli sen olursun. Ama dikkat, cok daginiksin, bir isi bitirmeden digerine baslarsın. Para gelir ama tutamazsin, harcarsin. Uc kere buyuk ask yasarsin hayat boyunca, sonuncusu evlilik olur. 28\'inden sonra para durur cebinde.\n\n4 - CALISKAN RUHU: Sen toprak gibi saglamsin evladim. Caliskanin en caliskansin. Sabir tanrisin, hicbir zorluktan yilmazsin. Ev alir, araba alir, duzenli para biriktiririrsin. Ama biraz katisin, eglenceyi bilmezsin. Romantizm senin degil, pratiklik senin isin. Iyi esin olacak, cocuklarina iyi baba/anne olacaksin. 35\'ten sonra emek veren islerin meyvesi gelir. Emlak isi iyi gider sana.\n\n5 - OZGUR RUHU: Kus gibisin evladim, kafese sigmazsin! Seyahat etmeden duramazsin, ayni yerde duramazsin, rutinden nefret edersin. Macera senin isin, risk almaktan cekinmezsin. Isini de degistirirsin, evini de. Birden fazla is yaparsin hayatta. Askta da aynisin, cabuk baglanir cabuk birakirsin. 33\'une kadar yerlesmezsin, o yasta bir is tutturur, bir insan gelir hayatina.\n\n6 - AILE INSANI: Senin her seyin aile evladim. Anne baba, es, cocuk hep senin omzunda. Herkes sana yaslanır, sen herkese bakmak zorunda kalirsin. Sorumluluk senin orta adin. Ev guzel olsun, duzen olsun istersin. Iyi yemek yapar, misafir agirlar, herkes seni sever. Ama unutma, sen kimden yardim goreceksin? 27\'de evlenme var, 32\'de kendi evin. Saglik isleri de iyi gider, doktor, hemsire olsan iyi olur.\n\n7 - DERIN RUHU: Sende hikmet var evladim! Ice donuksun, insanlarla fazla cakismazsin. Kitap okur, dusunur, arastirirsin. Ruhani yonun kuvvetli, ruyalarin gercek olur. Yalnizligi seversin, kalabalikta bogulursun. Parayi sevmezsin ama gelir sana, manevi zenginsin. 40\'tan sonra tam acarsin, o zaman anlarsın kendini. Ogretmenlik, astroloji, felsefe senin isin. Esin anlayisli olmali.\n\n8 - PARA VE GUC: Senin kaderinde zenginlik var evladim! Ama kolay gelmez, mucadele edersin. Buyuk isler kurar, buyuk paralar kazanirsin. Ama kayiplar da buyuk olur, sifira duser tekrar kalkarsin. Dongu boyle. Guclusun, heybetlisin, insanlar senden cekinir. Yoneticilik yakisir, patron olursun. 45\'ten sonra gercek serveti gorusun. Emlak, finans, buyuk ticaret senin isin. Esinle para kavgasi olabilir.\n\n9 - AKIL HOCASI: Sen bilgesin evladim, omrun boyunca ogrendin, simdi ogretme vakti. Comertsin, herkesin derdini dinlersin. Herkese yardim eder, hicbir sey beklemezsin. Manevi zenginsin ama maddi dunya senin degil. Parayi tutamaz, hep verir gidersin. Hayir isleri yapar, fakirlere bakar, hayvanlara acirsin. 50\'den sonra huzur bulursun, o zamana kadar sikinti cok. Sosyal is, vakif isi, egitim senin alanin.\n\n11 - SEZGININ COCUGU: Sende nur var evladim! Sezgilerin cok kuvvetli, bir insani gorunce hemen anlarsın. Ruyalarin gercek cikar, icinden sesler gelir. Ruhani guclerin var, farkinda degilsin belki. Sinir sistemin hassas, cok yorulursun, enerji alir verirsin. Isik iscisisin sen, insanlara ilham verirsin. Ama dikkat, cok gergin yasarsin, rahat edemezsin. Meditasyon, yoga lazim sana. 33\'te ruhsal uyanis var.\n\n22 - USTA MIMAR: Buyuk isler yapmaya geldin bu dunyaya evladim! 4\'un gucuyle 11\'in sezgisini birlestirmissin. Hayaller kurarsin ama gerceklestirirsin de. Kopru, bina, sistem kurar, arkanda iz birakırsin. Ama agir yuk var sirtinda, herkes senden cok sey bekler. Buyuk basarilar var, buyuk basarisizliklar da. Orta yok sende. 44\'te zirvesi, o zaman ismini herkes duyar.\n\n33 - MERHAMET USTASI: Sen sifacisin evladim, elinden bereket akar. Insanlari iyilestirirsin, ruhlarini dinlendirirsin. 6\'nin sevgisiyle 11\'in sezgisini tasirsin. Herkesin derdi sana gelir, sen cozersin. Ama kendini ihmal edersin, herkes senin derdini sormaz. Fedakarlik yaparsin hayatin boyunca. Sifa isi, danismanlik, terapistlik senin isin. 55\'te tam anlamini bulursun hayatinin.\n\nKONUSMA SEKLIN:\nSevgili ' + name + ' evladim, otur bakalim karsima. Sana sayilarindan bakacam simdi. Sen ' + birthDate + ' dogumlusun, demek ki yasam yolun su cikti. Isminin sayisi da su, bu da senin kaderini gosteriyor. 40 yildir bu isi yapiyorum, sayilar yalan soylemez bilirim...\n\nDETAYLAR EKLE:\n- Gozlerinden belli oluyor zaten...\n- Mayis ayina dikkat, bir degisiklik var\n- Cuma gunlerin senin sansli gunun\n- Yesil renk tak ustune, acar seni\n- 40 yasinda bir donum noktasi var\n\nSIMDI DIREKT FALI BAK - UZUN UZUN ANLAT - EN AZ 15 CUMLE!';

            const hamNum = await callOpenRouter([
                { role: 'system', content: numPrompt },
                { role: 'user', content: 'Numeroloji fali bak' }
            ], 0.98);

            const editorPrompt = 'Sen editorsun. Metni duzenle ama:\n- ASLA "bilgi gerekli", "soyler misin" gibi cumleler ekleme\n- ASLA soru ekleme, sorulari cikar\n- Robot dilini temizle\n- "Gecen ay biri geldi", "baska musteri" gibi ifadeleri SIL\n- Uzun, akici, samimi teyze dili yap\n- Paragraf halinde duzenle\n- Sonuna imza ya da veda ekleme\nIste metin: ' + hamNum;
            
            const temizNum = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: hamNum }
            ], 0.6);

            return res.json({ text: temizNum });
        }

        if (isKahveFali || isElFali) {
            if (!images || images.length === 0) {
                return res.json({ text: name + ' evladim, ' + (isKahveFali ? 'fincan' : 'el') + ' fotografi gonder bana.' });
            }

            if (isKahveFali) {
                const checkPrompt = 'KAHVE TELVESI var mi fincanda? Sadece EVET veya HAYIR de.';
                const guardResponse = await callOpenRouter([{ role: 'user', content: [...imageContent, { type: 'text', text: checkPrompt }] }], 0.1);

                if (guardResponse.toUpperCase().includes('HAYIR')) {
                    return res.json({ text: name + ' evladim, fincan belli degil bu. Telveli yerden cek, fincanin ici belli olsun. 40 yildir bakiyorum, bu fincandan bir sey goremem.' });
                }

                const kahinPrompt = 'Sen 40 yildir kahve fali bakan Ayse Teyzesin. Fincana bakarsin, figurleri gorusun, direkt anlatirsin.\n\nKULLANICI: ' + name + ', ' + age + ' yas, ' + gender + '\n\nGOREV: Fincandaki figurleri gor, konumlarina bak, anlamlarini soyle.\n\nFIGURLER: Kus(mujde), Yilan(dusman), Balik(para), Yol(seyahat), Dag(engel), Ev(aile)\nKONUM: Sag(gelecek iyi), Sol(gecmis kotu), Dip(uzak gelecek), Agiz(yakin)\n\nSevgili ' + name + ' evladim, fincanina baktim simdi. Sag tarafta kus goruyorum, mujde var...\n\nEN AZ 10 figur tespit et, hepsini UZUN anlat. Robot degil, 40 yillik falci baci.';

                const hamFal = await callOpenRouter([
                    { role: 'system', content: kahinPrompt },
                    { role: 'user', content: [...imageContent, { type: 'text', text: message }] }
                ], 0.95);

                const editorPrompt = 'Robot dilini temizle, figurleri koru. "Gecen hafta biri geldi" gibi ifadeleri SIL. Paragraf yap. Metin: ' + hamFal;
                const temizFal = await callOpenRouter([
                    { role: 'system', content: editorPrompt },
                    { role: 'user', content: hamFal }
                ], 0.6);

                return res.json({ text: temizFal });
            }

            if (isElFali) {
                const checkPrompt = 'ACIK INSAN ELI var mi, cizgiler gorunuyor mu? Sadece EVET veya HAYIR.';
                const guardResponse = await callOpenRouter([{ role: 'user', content: [...imageContent, { type: 'text', text: checkPrompt }] }], 0.1);

                if (guardResponse.toUpperCase().includes('HAYIR')) {
                    return res.json({ text: name + ' evladim, elin belli degil. Acik el, avuc ici yukari, isikli yerde cek. 40 yildir el okuyorum, bu sekilde goremem cizgileri.' });
                }

                const kahinPrompt = 'Sen 40 yildir el fali bakan Ayse Teyzesin. Ele bakarsin, cizgileri gorusun, direkt anlatirsin.\n\nKULLANICI: ' + name + ', ' + age + ' yas, ' + gender + '\n\nGOREV: Eldeki cizgileri gor, anlamlarini soyle.\n\nCIZGILER: Hayat(omur), Kalp(ask), Kader(kariyer), Akil(zeka)\n\nSevgili ' + name + ' evladim, eline baktim. Hayat cizgin uzun, saglikli omrun var...\n\nEN AZ 8 ozellik tespit et, UZUN anlat. Robot degil, 40 yillik el falcisi.';

                const hamFal = await callOpenRouter([
                    { role: 'system', content: kahinPrompt },
                    { role: 'user', content: [...imageContent, { type: 'text', text: message }] }
                ], 0.95);

                const editorPrompt = 'Robot dilini temizle, cizgileri koru. "Gecen hafta biri" ifadelerini SIL. Paragraf duzenle. Metin: ' + hamFal;
                const temizFal = await callOpenRouter([
                    { role: 'system', content: editorPrompt },
                    { role: 'user', content: hamFal }
                ], 0.6);

                return res.json({ text: temizFal });
            }
        }

        if (isTarot) {
            const tarotPrompt = 'Sen 40 yildir tarot bakan Ayse Teyzesin. Asla soru sormazsin, direkt kartlara bakarsin.\n\nKULLANICI: ' + name + ', ' + age + ' yas, ' + gender + '\nMESAJ: ' + message + '\n\nGOREV: Mesajda hangi kartlar var bul, direkt yorumla. Soru sorma, fala basla.\n\nSevgili ' + name + ' evladim, kartlarina baktim simdi. Ilk kart su, bu sana sunu soyluyor...\n\nUZUN UZUN anlat, en az 10 cumle. Robot degil, 40 yillik usta gibi konus.';

            const hamTarot = await callOpenRouter([
                { role: 'system', content: tarotPrompt },
                { role: 'user', content: message }
            ], 0.95);

            const editorPrompt = 'Robot dilini temizle, uzun paragraf yap. Soru ekleme. "Gecen ay biri" ifadelerini SIL. Metin: ' + hamTarot;
            const temizTarot = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: hamTarot }
            ], 0.6);

            return res.json({ text: temizTarot });
        }

        if (isBurc) {
            const bugunTarih = new Date().toLocaleDateString('tr-TR');
            const burcPrompt = 'Sen 40 yildir burc yorumu yapan Ayse Teyzesin. Asla soru sormazsin.\n\nKULLANICI: ' + name + ', ' + age + ' yas, dogum: ' + birthDate + '\nMESAJ: ' + message + '\nBUGUN: ' + bugunTarih + '\n\nGOREV: Burcunu tespit et, direkt yorum yap. Guncel gezegenleri soyle.\n\nSevgili ' + name + ' evladim, burcuna baktim. Su an Venus senin burcunda, bu sana sunu getiriyor...\n\nUZUN anlat, en az 12 cumle. Ask, kariyer, para ayri ayri. Robot degil, usta gibi.';

            const hamBurc = await callOpenRouter([
                { role: 'system', content: burcPrompt },
                { role: 'user', content: message }
            ], 0.95);

            const editorPrompt = 'Robot dilini temizle, gezegen isimlerini koru. "Gecen hafta biri" ifadelerini SIL. Metin: ' + hamBurc;
            const temizBurc = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: hamBurc }
            ], 0.6);

            return res.json({ text: temizBurc });
        }

        if (isRuya) {
            const ruyaPrompt = 'Sen 40 yildir ruya yorumlayan Ayse Teyzesin. Asla soru sormazsin.\n\nKULLANICI: ' + name + ', ' + age + ' yas\nRUYA: ' + message + '\n\nGOREV: Ruyadaki sembolleri bul, direkt yorumla.\n\nSevgili ' + name + ' evladim, ruyana baktim. Su gordun, bu su anlama geliyor...\n\nUZUN anlat, her sembol icin 3 cumle. Robot degil, bilge teyze gibi.';

            const hamRuya = await callOpenRouter([
                { role: 'system', content: ruyaPrompt },
                { role: 'user', content: message }
            ], 0.95);

            const editorPrompt = 'Robot dilini temizle. "Gecen hafta biri" ifadelerini SIL. Metin: ' + hamRuya;
            const temizRuya = await callOpenRouter([
                { role: 'system', content: editorPrompt },
                { role: 'user', content: hamRuya }
            ], 0.6);

            return res.json({ text: temizRuya });
        }

        res.json({ text: name + ' evladim, ne fala bakayim sana? Kahve, el, tarot, burc, ruya, sayi... Sec birini.' });

    } catch (e) {
        console.error('Error:', e.message);
        res.status(500).json({ error: 'Teyze su an mesgul evladim, biraz sonra gel.' });
    }
});

app.listen(3000, () => console.log('Server calisiyor port 3000'));
EOF
```

Sorun template literal backtick kullanimi yerine normal string concatenation kullandim. Simdi calismali.
