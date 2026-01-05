const express = require('express');
const https = require('https');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENROUTER_KEY = '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';
const TARGET_MODEL = 'openai/gpt-4o-mini';

async function callOpenRouter(messages) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ model: TARGET_MODEL, messages: messages });
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
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.choices && json.choices[0]) resolve(json.choices[0].message.content);
                    else reject(new Error(body));
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
        const name = userInfo?.name || 'Fatih';
        const systemPrompt = `Sen Ayşe Teyzesin. Çok samimi, neşeli ve gizemli bir falcısın. Kullanıcı adı: ${name}.`;
        const response = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message || 'Falıma bak.' }
        ]);
        res.json({ text: response });
    } catch (e) {
        res.status(500).json({ text: 'Nazar değdi kuzum, tekrar dene.' });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Sistem ${PORT} portunda aktif!`));
