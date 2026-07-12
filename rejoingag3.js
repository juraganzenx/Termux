const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const CONFIG_FILE = "accounts.json";
const PLACE_ID = 97598239454123;

const CHECK_INTERVAL = 10000;
const REJOIN_AFTER = 30000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

function extractCode(link) {
    const match = link.match(/code=([a-zA-Z0-9]+)/);

    if (match) return match[1];

    return link.trim();
}

async function usernameToUserId(username) {
    try {
        const res = await axios.post(
            "https://users.roblox.com/v1/usernames/users",
            {
                usernames: [username],
                excludeBannedUsers: false
            }
        );

        if (!res.data.data.length) return null;

        return res.data.data[0].id;
    } catch (err) {
        console.log(`[${username}] Lookup Error: ${err.message}`);
        return null;
    }
}

async function getPresence(userId) {
    try {
        const res = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            {
                userIds: [userId]
            },
            {
                timeout: 10000
            }
        );

        return res.data.userPresences?.[0] || null;
    } catch (err) {
        console.log(`[${userId}] Presence Error: ${err.message}`);
        return null;
    }
}

function openRoblox(account) {
    const deepLink =
        `roblox://placeID=${PLACE_ID}&linkCode=${account.serverCode}`;

    console.log(
        `[${account.username}] Membuka ${account.package}`
    );

    exec(
        `am start -a android.intent.action.VIEW -d "${deepLink}" -p ${account.package}`,
        err => {
            if (err) {
                console.log(
                    `[${account.username}] Gagal membuka Roblox: ${err.message}`
                );
            }
        }
    );
}

function monitorAccount(account) {
    console.log(
        `[START] ${account.username} (${account.package})`
    );

    openRoblox(account);

    setInterval(async () => {
        const presence = await getPresence(account.userId);

        if (!presence) return;

        const status = presence.userPresenceType;
        const now = Date.now();

        /*
        0 = Offline
        1 = Online
        2 = In Game
        3 = In Studio
        */

        if (status === 2) {
            if (account.lastStatus !== 2) {
                console.log(
                    `[${account.username}] ✅ Berhasil masuk game`
                );
            }

            account.offlineSince = null;
            account.lastStatus = 2;
            return;
        }

        if (account.lastStatus !== status) {
            console.log(
                `[${account.username}] ⚠️ Status ${status}`
            );

            account.lastStatus = status;
        }

        if (!account.offlineSince) {
            account.offlineSince = now;
            return;
        }

        if (now - account.offlineSince >= REJOIN_AFTER) {
            console.log(
                `[${account.username}] 🔄 Rejoin`
            );

            openRoblox(account);

            account.offlineSince = now;
        }

    }, CHECK_INTERVAL);
}

async function createConfig() {
    const count = parseInt(
        await ask("Berapa Roblox yang ingin digunakan? : ")
    );

    const accounts = [];

    for (let i = 0; i < count; i++) {
        console.log("");
        console.log("==============================");
        console.log(`ROBLOX #${i + 1}`);
        console.log("==============================");

        const packageName = await ask(
            "Client apa? (contoh com.roblox.clienu): "
        );

        const username = await ask(
            "Username apa?: "
        );

        const privateServer = await ask(
            "Link Private Server apa?: "
        );

        const userId = await usernameToUserId(username);

        if (!userId) {
            console.log("Username tidak ditemukan.");
            i--;
            continue;
        }

        accounts.push({
            package: packageName,
            username,
            userId,
            serverCode: extractCode(privateServer),
            offlineSince: null,
            lastStatus: null
        });
    }

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(accounts, null, 2)
    );

    console.log("");
    console.log("Config berhasil disimpan.");

    return accounts;
}

async function loadAccounts() {
    if (fs.existsSync(CONFIG_FILE)) {
        const useOld = await ask(
            "Gunakan konfigurasi sebelumnya? (y/n): "
        );

        if (useOld.toLowerCase() === "y") {
            return JSON.parse(
                fs.readFileSync(CONFIG_FILE, "utf8")
            );
        }
    }

    return await createConfig();
}

async function main() {
    const accounts = await loadAccounts();

    rl.close();

    console.log("");
    console.log("========== CONFIG ==========");

    for (const account of accounts) {
        console.log("");
        console.log(`Package  : ${account.package}`);
        console.log(`Username : ${account.username}`);
        console.log(`User ID  : ${account.userId}`);
        console.log(`PS Code  : ${account.serverCode}`);
    }

    console.log("");
    console.log("Monitoring dimulai...");
    console.log("");

    accounts.forEach((account, index) => {
        setTimeout(() => {
            monitorAccount(account);
        }, index * 5000);
    });
}

main();
