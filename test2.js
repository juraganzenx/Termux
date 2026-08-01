//REJOINGAG3.JS VERSI PUBLIK DAN PRIVATE//BUKA 1 PER 1 NUNGGU MASUK DULU
//+ GRID WINDOW LAYOUT (FREEFORM) BIAR TIDAK NUMPUK DI TENGAH

const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const CONFIG_FILE = "accounts.json";

const CHECK_INTERVAL = 10000;
const REJOIN_AFTER = 90000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// =========================================
// EXEC ASYNC HELPER
// =========================================
function execAsync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout);
        });
    });
}

// =========================================
// ASK INPUT
// =========================================
function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}

// =========================================
// EXTRACT PRIVATE SERVER CODE
// =========================================
function extractCode(link) {
    try {
        const url = new URL(link);
        const code = url.searchParams.get("code");
        if (code) {
            return code;
        }
    } catch {}
    return link.trim();
}

// =========================================
// USERNAME -> USERID
// =========================================
async function usernameToUserId(username) {
    try {
        const response = await axios.post(
            "https://users.roblox.com/v1/usernames/users",
            {
                usernames: [username],
                excludeBannedUsers: false
            }
        );

        if (!response.data.data || !response.data.data.length) {
            return null;
        }

        return response.data.data[0].id;

    } catch (err) {
        console.log(`[ERROR] Username lookup gagal: ${username}`);
        return null;
    }
}

// =========================================
// GET PRESENCE
// =========================================
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
        console.log(`[${userId}] Presence error`);
        return null;
    }
}

// =========================================
// GRID LAYOUT HELPERS
// =========================================

// Ambil ukuran layar via `wm size`
async function getScreenSize() {
    try {
        const output = await execAsync(`su -c "wm size"`);
        // biasanya formatnya: "Physical size: 1080x2400"
        const match = output.match(/(\d+)x(\d+)/);
        if (match) {
            return {
                width: parseInt(match[1]),
                height: parseInt(match[2])
            };
        }
    } catch (err) {
        console.log(`[WARN] Gagal ambil ukuran layar, pakai default 1080x2400`);
    }
    return { width: 1080, height: 2400 };
}

// Hitung posisi grid (bounds) berdasarkan index akun
function calcBounds(index, total, screen, marginPx = 10) {
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);

    const cellW = Math.floor(screen.width / cols);
    const cellH = Math.floor(screen.height / rows);

    const col = index % cols;
    const row = Math.floor(index / cols);

    const x1 = col * cellW + marginPx;
    const y1 = row * cellH + marginPx;
    const x2 = (col + 1) * cellW - marginPx;
    const y2 = (row + 1) * cellH - marginPx;

    return `${x1},${y1},${x2},${y2}`;
}

// Aktifkan dukungan freeform window (dipanggil sekali di awal)
async function enableFreeformSupport() {
    console.log("");
    console.log("[SETUP] Mengaktifkan freeform window support...");

    const commands = [
        `su -c "settings put global development_settings_enabled 1"`,
        `su -c "settings put global enable_freeform_support 1"`,
        `su -c "settings put global force_resizable_activities 1"`
    ];

    for (const cmd of commands) {
        try {
            await execAsync(cmd);
        } catch (err) {
            console.log(`[WARN] Gagal jalankan: ${cmd}`);
            console.log(`       ${err.message}`);
        }
    }

    console.log("[SETUP] Selesai. (Jika HP tidak support freeform, window akan tetap fullscreen)");
}

// =========================================
// OPEN ROBLOX
// PUBLIC / PRIVATE + GRID BOUNDS
// =========================================
function openRoblox(account, screen, totalAccounts) {
    return new Promise((resolve) => {

        console.log("");
        console.log(`[${account.username}] Restart Roblox`);

        // =====================================
        // STOP ROBLOX
        // =====================================
        exec(`su -c "am force-stop ${account.package}"`, (err) => {

            if (err) {
                console.log(`[${account.username}] Stop error: ${err.message}`);
            } else {
                console.log(`[${account.username}] Roblox closed`);
            }

            // =================================
            // WAIT 3 SECOND
            // =================================
            setTimeout(() => {

                let link;

                // =================================
                // PUBLIC SERVER
                // =================================
                if (account.serverType === "public") {

                    link = `https://www.roblox.com/games/start?placeId=${account.placeId}`;

                    console.log("");
                    console.log(`[${account.username}] Mode: PUBLIC`);
                    console.log(`[${account.username}] Place ID: ${account.placeId}`);

                }
                // =================================
                // PRIVATE SERVER
                // =================================
                else {

                    link = `https://www.roblox.com/share?code=${account.serverCode}&type=Server`;

                    console.log("");
                    console.log(`[${account.username}] Mode: PRIVATE SERVER`);
                    console.log(`[${account.username}] Server Code: ${account.serverCode}`);

                }

                console.log("");
                console.log(`[${account.username}] Opening Roblox...`);
                console.log(`[${account.username}] Link: ${link}`);

                // =================================
                // HITUNG BOUNDS GRID UNTUK AKUN INI
                // =================================
                const bounds = calcBounds(account.index, totalAccounts, screen);

                console.log(`[${account.username}] Bounds: ${bounds}`);

                // =================================
                // OPEN ROBLOX (FREEFORM + BOUNDS)
                // =================================
                const command =
                    `am start --windowingMode 5 --bounds ${bounds} ` +
                    `-a android.intent.action.VIEW -d "${link}" -p ${account.package}`;

                console.log("");
                console.log(`[DEBUG] ${command}`);

                exec(command, (err) => {

                    if (err) {
                        console.log(`[${account.username}] Open error: ${err.message}`);
                        resolve(false);
                        return;
                    }

                    console.log("");
                    console.log(`[${account.username}] Launch OK`);
                    resolve(true);

                });

            }, 3000);

        });

    });
}

// =========================================
// WAIT UNTIL IN GAME
// =========================================
function waitUntilInGame(account) {
    return new Promise((resolve) => {

        console.log("");
        console.log(`[${account.username}] Menunggu masuk game...`);

        const check = setInterval(async () => {

            const presence = await getPresence(account.userId);

            if (!presence) {
                return;
            }

            const status = presence.userPresenceType;

            /*
                0 = Offline
                1 = Online
                2 = In Game
                3 = Studio
            */

            console.log(`[${account.username}] Presence: ${status}`);

            // =================================
            // IN GAME
            // =================================
            if (status === 2) {

                console.log("");
                console.log(`[${account.username}] ✅ Berhasil masuk game`);

                clearInterval(check);

                account.offlineSince = null;
                account.lastStatus = 2;

                resolve(true);

            }

        }, CHECK_INTERVAL);

    });
}

// =========================================
// MONITOR ACCOUNT
// =========================================
function monitorAccount(account, screen, totalAccounts) {

    console.log(`[START] Monitoring ${account.username}`);

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
            3 = Studio
        */

        // =====================================
        // IN GAME
        // =====================================
        if (status === 2) {

            if (account.lastStatus !== 2) {
                console.log(`[${account.username}] ✅ In Game`);
            }

            account.offlineSince = null;
            account.lastStatus = 2;

            return;
        }

        // =====================================
        // STATUS BERUBAH
        // =====================================
        if (account.lastStatus !== status) {
            console.log(`[${account.username}] Status ${status}`);
            account.lastStatus = status;
        }

        // =====================================
        // MULAI HITUNG OFFLINE
        // =====================================
        if (!account.offlineSince) {
            account.offlineSince = now;
            return;
        }

        // =====================================
        // HITUNG DURASI
        // =====================================
        const elapsed = now - account.offlineSince;

        // =====================================
        // REJOIN SETELAH 90 DETIK
        // =====================================
        if (elapsed >= REJOIN_AFTER) {

            console.log("");
            console.log(`[${account.username}] 🔄 Rejoin`);

            openRoblox(account, screen, totalAccounts);

            account.offlineSince = now;

        }

    }, CHECK_INTERVAL);

}

// =========================================
// CREATE CONFIG
// =========================================
async function createConfig() {

    const packages = [
        "com.roblox.clienu",
        "com.roblox.clienv",
        "com.roblox.clienw",
        "com.roblox.clienx",
        "com.roblox.clieny",
        "com.roblox.clienz",
        "com.roblox.cliens",
        "com.roblox.clienr",
        "com.roblox.clienq",
        "com.roblox.clienp"
    ];

    const count = parseInt(await ask("Berapa Roblox yang digunakan (1-10): "));

    if (isNaN(count) || count < 1 || count > packages.length) {
        console.log("Jumlah harus 1-10");
        process.exit(0);
    }

    const accounts = [];

    // =========================================
    // INPUT ACCOUNT
    // =========================================
    for (let i = 0; i < count; i++) {

        console.log("");
        console.log(`===== ROBLOX ${i + 1} =====`);
        console.log(`Package : ${packages[i]}`);
        console.log("");
        console.log("Format Public : username-public-PLACE_ID");
        console.log("Format Private: username-LINK_PRIVATE_SERVER");
        console.log("");

        const input = await ask("USERNAME-SERVER : ");

        // =====================================
        // CEK PUBLIC
        // =====================================
        const publicMatch = input.match(/^([^-]+)-public-(\d+)$/);

        if (publicMatch) {

            const username = publicMatch[1].trim();
            const placeId = publicMatch[2].trim();

            console.log("");
            console.log(`[${username}] Mode PUBLIC`);
            console.log(`Place ID: ${placeId}`);

            // =================================
            // GET USER ID
            // =================================
            const userId = await usernameToUserId(username);

            if (!userId) {
                console.log("Username tidak ditemukan");
                i--;
                continue;
            }

            accounts.push({
                index: i,
                package: packages[i],
                username: username,
                userId: userId,
                serverType: "public",
                placeId: placeId,
                serverCode: null,
                offlineSince: null,
                lastStatus: null
            });

            continue;
        }

        // =====================================
        // PRIVATE SERVER
        // =====================================
        const split = input.split("-");

        if (split.length < 2) {
            console.log("Format salah!");
            i--;
            continue;
        }

        const username = split.shift().trim();
        const privateServer = split.join("-").trim();

        // =================================
        // GET USER ID
        // =================================
        const userId = await usernameToUserId(username);

        if (!userId) {
            console.log("Username tidak ditemukan");
            i--;
            continue;
        }

        accounts.push({
            index: i,
            package: packages[i],
            username: username,
            userId: userId,
            serverType: "private",
            placeId: null,
            serverCode: extractCode(privateServer),
            offlineSince: null,
            lastStatus: null
        });

    }

    // =========================================
    // SAVE CONFIG
    // =========================================
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(accounts, null, 2));

    console.log("");
    console.log("accounts.json dibuat");

    return accounts;
}

// =========================================
// LOAD CONFIG
// =========================================
async function loadAccounts() {

    if (fs.existsSync(CONFIG_FILE)) {

        console.log("Menggunakan accounts.json");

        const accounts = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));

        // pastikan field "index" selalu ada (untuk config lama)
        accounts.forEach((acc, i) => {
            if (typeof acc.index !== "number") {
                acc.index = i;
            }
        });

        return accounts;
    }

    return await createConfig();
}

// =========================================
// MAIN
// =========================================
async function main() {

    // =========================================
    // AKTIFKAN FREEFORM SUPPORT
    // =========================================
    await enableFreeformSupport();

    // =========================================
    // LOAD ACCOUNTS
    // =========================================
    const accounts = await loadAccounts();

    rl.close();

    // =========================================
    // AMBIL UKURAN LAYAR (SEKALI SAJA)
    // =========================================
    const screen = await getScreenSize();

    console.log("");
    console.log(`[SCREEN] Ukuran layar terdeteksi: ${screen.width}x${screen.height}`);

    const totalAccounts = accounts.length;

    // =========================================
    // SHOW ACCOUNT
    // =========================================
    console.log("");
    console.log("===== ACCOUNT =====");

    for (const acc of accounts) {

        console.log("");
        console.log("Package:", acc.package);
        console.log("Username:", acc.username);
        console.log("UserId:", acc.userId);
        console.log("Type:", acc.serverType);

        if (acc.serverType === "public") {
            console.log("Place ID:", acc.placeId);
        } else {
            console.log("Code:", acc.serverCode);
        }

    }

    // =========================================
    // START
    // =========================================
    console.log("");
    console.log("===== STARTING ROBLOX BERURUTAN =====");

    // =========================================
    // OPEN ONE BY ONE
    // =========================================
    for (let i = 0; i < accounts.length; i++) {

        const acc = accounts[i];

        console.log("");
        console.log("========================================");
        console.log(`ROBLOX ${i + 1}/${accounts.length}`);
        console.log(`USERNAME: ${acc.username}`);
        console.log(`TYPE: ${acc.serverType}`);
        console.log("========================================");

        // =====================================
        // OPEN ROBLOX
        // =====================================
        const launched = await openRoblox(acc, screen, totalAccounts);

        if (!launched) {
            console.log(`[${acc.username}] ❌ Gagal launch`);
            continue;
        }

        // =====================================
        // WAIT IN GAME
        // =====================================
        await waitUntilInGame(acc);

        console.log("");
        console.log(`[${acc.username}] ✅ Siap`);
        console.log("Lanjut membuka akun berikutnya...");

    }

    // =========================================
    // ALL ACCOUNT READY
    // =========================================
    console.log("");
    console.log("========================================");
    console.log("✅ SEMUA ROBLOX SUDAH MASUK GAME");
    console.log("========================================");
    console.log("");
    console.log("Monitoring berjalan...");

    // =========================================
    // START MONITORING
    // =========================================
    accounts.forEach((acc) => {
        monitorAccount(acc, screen, totalAccounts);
    });

}

// =========================================
// RUN
// =========================================
main();
