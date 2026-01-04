const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const app = express();

// Port ayarı: Coolify'ın vereceği portu kullan, yoksa 3000'i kullan
const port = process.env.PORT || 3000;

app.use(express.json());

// Statik dosyaların (index.html, css vb.) olduğu klasör
app.use(express.static('public')); 

// API anahtarını güvenli bir şekilde Environment Variables'dan alıyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(req.body.message);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Gemini API Hatası:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Tüm diğer istekleri index.html'e yönlendir (Frontend için)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// KRİTİK AYAR: "0.0.0.0" ekleyerek dış dünyadan gelen isteklere izin veriyoruz
app.listen(port, "0.0.0.0", () => {
    console.log(`Sunucu aktif! Port: ${port} üzerinde tüm ağları dinliyor.`);
});