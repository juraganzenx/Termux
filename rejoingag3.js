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
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}

function extractCode(link) {
    const match = link.match(/code=([a-zA-Z0-9]+)/i);

    if (match) {
        return match[1];
    }

    return link.trim();
}

async function usernameToUserId(username) {
    try {
        const response = await axios.post(
            "https://users.roblox.com/v1/usernames/users",
            {
                usernames: [username],
                excludeBannedUsers: false
            }
        );

        if (!response.data.data.length) {
            return null;
        }

        return response.data.data[0].id;
    } catch (err) {
        console.log(
            `[ERROR] Username lookup gagal (${username})`
        );

        return null;
    }
}

async function getPresence(userId) {
    try {
        const response = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            {
                userIds: [userId]
            },
            {
                timeout: 10000
            }
        );

        return response.data.userPresences?.[0] || null;
    } catch (err) {
        console.log(
            `[${userId}] Presence Error: ${err.message}`
        );

        return null;
    }
}

function openRoblox(account) {
    const deepLink =
        `roblox://placeID=${PLACE_ID}&code=${account.serverCode}`;

    exec(`am force-stop ${account.package}`, () => {

        setTimeout(() => {

            exec(
                `monkey -p ${account.package} -c android.intent.category.LAUNCHER 1`,
                () => {

                    setTimeout(() => {

                        exec(
                            `am start -W -a android.intent.action.VIEW -d "${deepLink}" -p ${account.package}`,
                            (err) => {
                                if (err) {
                                    console.log(
                                        `[${account.username}] ${err.message}`
                                    );
                                }
                            }
                        );

                    }, 5000);

                }
            );

        }, 3000);

    });
}

function monitorAccount(account) {
    console.log(
        `[START] Monitoring ${account.username}`
    );

    openRoblox(account);

    setInterval(async () => {
        const presence = await getPresence(
            account.userId
        );

        if (!presence) {
            return;
        }

        const status =
            presence.userPresenceType;

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
                    `[${account.username}] ✅ In Game`
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

        const elapsed =
            now - account.offlineSince;

        if (elapsed >= REJOIN_AFTER) {
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
        await ask(
            "Berapa Roblox yang ingin digunakan?: "
        )
    );

    const accounts = [];

    for (let i = 0; i < count; i++) {
        console.log("");
        console.log(
            `========== ROBLOX ${i + 1} ==========\n`
        );

        const packageName = await ask(
            "Package Roblox: "
        );

        const username = await ask(
            "Username Roblox: "
        );

        const privateServer = await ask(
            "Link Private Server: "
        );

        const userId =
            await usernameToUserId(username);

        if (!userId) {
            console.log(
                "Username tidak ditemukan."
            );

            i--;
            continue;
        }

        accounts.push({
            package: packageName,
            username: username,
            userId: userId,
            serverCode: extractCode(
                privateServer
            ),
            offlineSince: null,
            lastStatus: null
        });
    }

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(accounts, null, 2)
    );

    console.log("");
    console.log(
        "[INFO] accounts.json berhasil dibuat."
    );

    return accounts;
}

async function loadAccounts() {
    if (fs.existsSync(CONFIG_FILE)) {
        console.log(
            "[INFO] Menggunakan accounts.json"
        );

        return JSON.parse(
            fs.readFileSync(
                CONFIG_FILE,
                "utf8"
            )
        );
    }

    console.log(
        "[INFO] accounts.json tidak ditemukan."
    );

    return await createConfig();
}

async function main() {
    const accounts =
        await loadAccounts();

    rl.close();

    console.log("");
    console.log(
        "========== CONFIG =========="
    );

    for (const account of accounts) {
        console.log("");
        console.log(
            `Package : ${account.package}`
        );

        console.log(
            `Username: ${account.username}`
        );

        console.log(
            `UserId  : ${account.userId}`
        );

        console.log(
            `Code    : ${account.serverCode}`
        );
    }

    console.log("");
    console.log(
        "Monitoring dimulai..."
    );

    accounts.forEach(
        (account, index) => {
            setTimeout(() => {
                monitorAccount(account);
            }, index * 5000);
        }
    );
}

main();
