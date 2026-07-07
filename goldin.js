const { Client, GatewayIntentBits } = require("discord.js");
const { exec } = require("child_process");

// ======================================
// CONFIG
// ======================================

const DISCORD_TOKEN = "TOKEN_BOT_KAMU";
const TARGET_CHANNEL_ID = "1476958871498129602";

const REJOIN_COOLDOWN_MS = 5 * 60 * 1000;

// cooldown per JobId
const lastJoin = {};

// ======================================
// DISCORD CLIENT
// ======================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ======================================
// READY
// ======================================

client.once("ready", () => {

    console.log("");
    console.log("=====================================");
    console.log(`BOT READY -> ${client.user.tag}`);
    console.log(`CHANNEL   -> ${TARGET_CHANNEL_ID}`);
    console.log("=====================================");
    console.log("");

});

// ======================================
// MESSAGE
// ======================================

client.on("messageCreate", async (message) => {

    try {

        // hanya channel target
        if (message.channel.id !== TARGET_CHANNEL_ID)
            return;

        let raw = "";

        // pesan biasa
        if (message.content)
            raw += message.content + "\n";

        // embed
        if (message.embeds?.length) {

            for (const embed of message.embeds) {

                if (embed.title)
                    raw += embed.title + "\n";

                if (embed.description)
                    raw += embed.description + "\n";

                if (embed.fields?.length) {

                    for (const field of embed.fields) {

                        raw += `${field.name}: ${field.value}\n`;

                    }
                }
            }
        }

        // ======================================
        // DETECT MOON
        // ======================================

        const isGold =
            raw.includes("GOLD MOON Detected");

        const isRainbow =
            raw.includes("RAINBOW MOON Detected");

        if (!isGold && !isRainbow)
            return;

        // ======================================
        // PARSE DATA
        // ======================================

        const playerMatch =
            raw.match(/Player:\s*(.+)/i);

        const placeMatch =
            raw.match(/PlaceId:\s*(\d+)/i);

        const jobMatch =
            raw.match(/JobId:\s*([a-zA-Z0-9-]+)/i);

        const joinMatch =
            raw.match(/roblox:\/\/[^\s]+/i);

        if (!placeMatch || !jobMatch)
            return;

        const player =
            playerMatch
                ? playerMatch[1].trim()
                : "Unknown";

        const placeId =
            placeMatch[1];

        const jobId =
            jobMatch[1];

        const joinLink =
            joinMatch
                ? joinMatch[0]
                : `roblox://placeID=${placeId}&gameInstanceId=${jobId}`;

        const moonType =
            isGold
                ? "GOLD MOON"
                : "RAINBOW MOON";

        // ======================================
        // COOLDOWN
        // ======================================

        const now = Date.now();

        if (
            lastJoin[jobId] &&
            now - lastJoin[jobId] < REJOIN_COOLDOWN_MS
        ) {

            const remain =
                Math.ceil(
                    (
                        REJOIN_COOLDOWN_MS -
                        (now - lastJoin[jobId])
                    ) / 1000
                );

            console.log(
                `[COOLDOWN] ${moonType} (${remain}s)`
            );

            return;
        }

        lastJoin[jobId] = now;

        // ======================================
        // LOG
        // ======================================

        console.log("");
        console.log("=====================================");
        console.log(`${moonType} DETECTED`);
        console.log(`PLAYER : ${player}`);
        console.log(`PLACE  : ${placeId}`);
        console.log(`JOB ID : ${jobId}`);
        console.log(`LINK   : ${joinLink}`);
        console.log("=====================================");
        console.log("");

        // ======================================
        // JOIN
        // ======================================

        exec(
            `am start -a android.intent.action.VIEW -d "${joinLink}"`,
            (err) => {

                if (err) {

                    console.log(
                        "Join gagal:"
                    );

                    console.log(
                        err.message
                    );

                    return;
                }

                console.log(
                    `${moonType} berhasil dibuka`
                );

            }
        );

    } catch (err) {

        console.log(
            "ERROR:",
            err.message
        );

    }

});

// ======================================
// LOGIN
// ======================================

client.login(DISCORD_TOKEN);