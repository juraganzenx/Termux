const axios = require("axios");
const { exec } = require("child_process");

// =========================
// PRIVATE SERVERS
// =========================
const SERVERS = [
    "https://www.roblox.com/share?code=36d9b3e78a9dd04888662908230d803f&type=Server",
    "https://www.roblox.com/share?code=6b9fbe28b269684f87c0115bab7ca23c&type=Server",
    "https://www.roblox.com/share?code=03ceb8edb9f2064c8ca67022010c7822&type=Server",
    "https://www.roblox.com/share?code=f47d43513419b445b5d8373271213ca4&type=Server",
    "https://www.roblox.com/share?code=e3a2a9ff24c1ac479ea42600b20786f8&type=Server"
];

// =========================
// ACCOUNT CONFIG
// =========================
const ACCOUNTS = [
    {
        name: "ROBLOX 1",
        package: "com.roblox.clienu",
        userId: 11274367210,
        currentServer: 0,
        offlineSince: null,
        lastStatus: null
    },
    {
        name: "ROBLOX 2",
        package: "com.roblox.clienv",
        userId: 11274365461,
        currentServer: 0,
        offlineSince: null,
        lastStatus: null
    }
];

// =========================
// SETTINGS
// =========================
const CHECK_INTERVAL = 10000; // cek setiap 10 detik
const REJOIN_AFTER = 30000;   // rejoin setelah 30 detik gagal masuk

// =========================
// OPEN ROBLOX
// =========================
function openRoblox(account) {
    const link = SERVERS[account.currentServer];

    console.log(
        `[${account.name}] Membuka Private Server ${account.currentServer + 1}`
    );

    exec(
        `am start -n ${account.package}/com.roblox.client.startup.ActivitySplash -a android.intent.action.VIEW -d "${link}"`,
        (err, stdout, stderr) => {
            if (err) {
                console.log(
                    `[${account.name}] ERROR membuka Roblox:`,
                    err.message
                );
                return;
            }

            console.log(
                `[${account.name}] Launch command dikirim`
            );
        }
    );
}

// =========================
// NEXT SERVER
// =========================
function nextServer(account) {
    account.currentServer =
        (account.currentServer + 1) % SERVERS.length;

    console.log(
        `[${account.name}] Berpindah ke Private Server ${account.currentServer + 1}`
    );

    openRoblox(account);
}

// =========================
// GET PRESENCE
// =========================
async function getPresence(userId) {
    try {
        const response = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            {
                userIds: [userId]
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 10000
            }
        );

        return response.data.userPresences?.[0] || null;
    }
    catch (err) {
        console.log(
            `[${userId}] Presence Error: ${err.message}`
        );

        return null;
    }
}

// =========================
// MONITOR ACCOUNT
// =========================
function monitorAccount(account) {
    console.log(
        `[${account.name}] Monitoring User ${account.userId}`
    );

    openRoblox(account);

    setInterval(async () => {
        const presence = await getPresence(account.userId);

        if (!presence) {
            return;
        }

        const status = presence.userPresenceType;
        const now = Date.now();

        /*
        0 = Offline
        1 = Online
        2 = In Game
        3 = In Studio
        */

        // =========================
        // BERHASIL MASUK GAME
        // =========================
        if (status === 2) {
            if (account.lastStatus !== 2) {
                console.log(
                    `[${new Date().toLocaleTimeString()}] [${account.name}] ✅ Berhasil masuk game`
                );
            }

            account.lastStatus = 2;
            account.offlineSince = null;
            return;
        }

        // =========================
        // BELUM DI GAME
        // =========================
        if (account.lastStatus !== status) {
            console.log(
                `[${new Date().toLocaleTimeString()}] [${account.name}] ⚠️ Status ${status} (belum masuk game)`
            );

            account.lastStatus = status;
        }

        if (!account.offlineSince) {
            account.offlineSince = now;
            return;
        }

        const elapsed = now - account.offlineSince;

        if (elapsed >= REJOIN_AFTER) {
            console.log(
                `[${new Date().toLocaleTimeString()}] [${account.name}] 🔄 Rejoin karena gagal masuk game selama ${REJOIN_AFTER / 1000} detik`
            );

            nextServer(account);

            account.offlineSince = now;
        }

    }, CHECK_INTERVAL);
}

// =========================
// START
// =========================
console.log("================================");
console.log(" ROBLOX MULTI PRIVATE REJOIN ");
console.log("================================");

monitorAccount(ACCOUNTS[0]);

setTimeout(() => {
    monitorAccount(ACCOUNTS[1]);
}, 5000);
