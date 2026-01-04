export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    const apiKey = "AIzaSyAbsPzRo4QcSgVUmy__u1lNV2aBvuwDhKw"; 
    
    // En stabil model ismi: gemini-pro (v1 sürümü)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Google'dan gelen hata varsa direkt kullanıcıya yansıt
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        // Veriyi güvenli bir şekilde döndür
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Sunucu Hatası: " + error.message });
    }
}