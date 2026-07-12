const axios = require("axios");
const { exec } = require("child_process");

const PLACE_ID = 126884695634066;

// =========================
// ACCOUNT CONFIG
// =========================
const ACCOUNTS = [
    {
        package: "com.roblox.clienu",
        username: "USERNAME_AKUN_1",

        servers: [
            "36d9b3e78a9dd04888662908230d803f",
            "6b9fbe28b269684f87c0115bab7ca23c",
            "03ceb8edb9f2064c8ca67022010c7822"
        ],

        currentServer: 0,
        offlineSince: null,
        lastStatus: null,
        userId: null
    },

    {
        package: "com.roblox.clienv",
        username: "USERNAME_AKUN_2",

        servers: [
            "f47d43513419b445b5d8373271213ca4",
            "e3a2a9ff24c1ac479ea42600b20786f8"
        ],

        currentServer: 0,
        offlineSince: null,
        lastStatus: null,
        userId: null
    }
];

// =========================
// SETTINGS
// =========================
const CHECK_INTERVAL = 10000;
const REJOIN_AFTER = 30000;

// =========================
// USERNAME -> USER ID
// =========================
async function getUserId(username) {
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
    }
    catch (err) {
        console.log(
            `[${username}] User lookup error:`,
            err.message
        );

        return null;
    }
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
                timeout: 10000
            }
        );

        return response.data.userPresences?.[0] || null;
    }
    catch (err) {
        console.log(
            `[${userId}] Presence error:`,
            err.message
        );

        return null;
    }
}

// =========================
// OPEN ROBLOX
// =========================
function openRoblox(account) {
    const code =
        account.servers[account.currentServer];

    const link =
        `roblox://placeID=${PLACE_ID}&linkCode=${code}`;

    console.log(
        `[${account.username}] Membuka PS ${account.currentServer + 1}`
    );

    exec(
        `am start -a android.intent.action.VIEW -d "${link}" -p ${account.package}`,
        (err) => {
            if (err) {
                console.log(
                    `[${account.username}] Open error:`,
                    err.message
                );
                return;
            }

            console.log(
                `[${account.username}] Join command dikirim`
            );
        }
    );
}

// =========================
// NEXT SERVER
// =========================
function nextServer(account) {
    account.currentServer =
        (account.currentServer + 1) %
        account.servers.length;

    console.log(
        `[${account.username}] Ganti ke PS ${account.currentServer + 1}`
    );

    openRoblox(account);
}

// =========================
// MONITOR ACCOUNT
// =========================
function monitorAccount(account) {
    console.log(
        `[${account.username}] Monitoring UserId ${account.userId}`
    );

    openRoblox(account);

    setInterval(async () => {
        const presence =
            await getPresence(account.userId);

        if (!presence) return;

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

            account.lastStatus = 2;
            account.offlineSince = null;
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

            nextServer(account);

            account.offlineSince = now;
        }
    }, CHECK_INTERVAL);
}

// =========================
// START
// =========================
async function start() {
    console.log("==================================");
    console.log(" ROBLOX MULTI REJOIN SYSTEM ");
    console.log("==================================");

    for (const account of ACCOUNTS) {
        const userId =
            await getUserId(account.username);

        if (!userId) {
            console.log(
                `[${account.username}] Username tidak ditemukan`
            );

            continue;
        }

        account.userId = userId;

        console.log(
            `[CONFIG]
Package : ${account.package}
Username: ${account.username}
UserId  : ${userId}
PS Count: ${account.servers.length}
`
        );
    }

    monitorAccount(ACCOUNTS[0]);

    setTimeout(() => {
        monitorAccount(ACCOUNTS[1]);
    }, 5000);
}

start();
