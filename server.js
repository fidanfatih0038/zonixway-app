const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// SENİN MANTIĞIN: En iyi çalışan modeli bulan fonksiyon
async function findBestModel() {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    for (let m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            // Çok küçük bir test isteği gönderiyoruz çalışıyor mu diye
            await model.generateContent("test"); 
            console.log(`Başarılı Model Seçildi: ${m}`);
            return m;
        } catch (e) {
            console.log(`${m} denendi ama çalışmadı, sıradakine geçiliyor...`);
        }
    }
    return "gemini-1.5-flash"; // En kötü ihtimalle bunu döndür
}

app.post('/api/chat', async (req, res) => {
    try {
        const workingModelName = await findBestModel(); // Senin fikrin burada devreye giriyor
        const model = genAI.getGenerativeModel({ model: workingModelName });
        
        const { message, images } = req.body;
        let parts = [{ text: message }];

        if (images && images.length > 0) {
            images.forEach(img => {
                parts.push({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: img.split(',')[1]
                    }
                });
            });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Hata:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Akıllı Kâhin ${PORT} portunda yayında!`));