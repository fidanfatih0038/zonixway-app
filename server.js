const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API anahtarını Coolify'dan çekiyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        // v1beta sürümünü zorlayarak en yeni modeli çağırıyoruz
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-flash" },
            { apiVersion: 'v1beta' } // BU SATIR SİHİRLİ DOKUNUŞ!
        );
        
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
        console.error("Gemini API Detaylı Hata:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Kâhin v1beta kapısında yayında! Port: ${PORT}`));