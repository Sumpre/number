const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('The Ghost is awake.');
});

app.post('/log', async (req, res) => {
    if (!DISCORD_WEBHOOK_URL) {
        console.error("FATAL: DISCORD_WEBHOOK_URL is not configured on the server!");
        return res.status(500).json({ error: 'Server configuration error.' });
    }
    const payload = req.body;

    if (!payload || !payload.embeds) {
        console.log("Received an invalid or empty payload.");
        return res.status(400).json({ error: 'Invalid payload.' });
    }

    try {
        await axios.post(DISCORD_WEBHOOK_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error forwarding to Discord:", error.message);
        res.status(502).json({ error: 'Failed to forward message.' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);
});
