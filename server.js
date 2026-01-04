const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images } = req.body;
        
        // Hangi modellerin aktif olduğunu Google'dan soruyoruz
        const modelList = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
        let model;
        
        // İlk çalışan modeli bulana kadar dene
        for (let name of modelList) {
            try {
                model = genAI.getGenerativeModel({ model: name });
                // Küçük bir test yapalım
                await model.generateContent("test"); 
                console.log("Seçilen model:", name);
                break; 
            } catch (e) {
                console.log(name + " çalışmadı, sonrakine geçiliyor...");
            }
        }

        let parts = [{ text: message }];
        if (images && images.length > 0) {
            images.forEach(img => {
                parts.push({ inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] } });
            });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Hata:", error);
        res.status(500).json({ error: "Kahin şu an derin uykuda, lütfen tekrar dene." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Otomatik Model Seçici Yayında!`));