cat << 'EOF' > server.js
const express = require('express');
const https = require('https');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const OPENROUTER_KEY = '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';
const TARGET_MODEL = 'openai/gpt-4o-mini';

async function callOpenRouter(messages) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: TARGET_MODEL,
            messages: messages
        });
        const options = {
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'Content-Type': 'application/json'
            }
        };
        const request = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content);
                    } else { reject(new Error(body)); }
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
        const { message, userInfo } = req.body;
        const name = userInfo?.name || "Evladım";
        const systemPrompt = `Sen 40 yıllık Ayşe Teyzesin. Numeroloji, Tarot, El ve Kahve falı piri olmuşsun. Kullanıcı: ${name}. Çok samimi, en az 25 cümlelik, detaylı ve gelecek tarihli bir fal bak. 1984'ten beri bu iştesin.`;
        
        const response = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message || "Genel bir fal bak." }
        ]);
        res.json({ text: response });
    } catch (e) {
        res.status(500).json({ text: "Nazar değdi kuzum." });
    }
});

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(3000, '0.0.0.0', () => console.log('Ayşe Teyze 3000 portunda tertemiz canlandı!'));
EOF
