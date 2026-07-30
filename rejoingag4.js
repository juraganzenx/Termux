// REJOINGAG4.JS
// PUBLIC + PRIVATE
// BUKA 1 PER 1
// AUTO RESIZE ROBLOX 5x2
//
// RESOLUTION LANDSCAPE:
// 1280 x 720
//
// WINDOW:
// 256 x 360
//
// LAYOUT:
//
// ROBLOX 1 | ROBLOX 2 | ROBLOX 3 | ROBLOX 4 | ROBLOX 5
// ROBLOX 6 | ROBLOX 7 | ROBLOX 8 | ROBLOX 9 | ROBLOX 10


const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");


// =========================================
// CONFIG
// =========================================

const CONFIG_FILE = "accounts.json";

const CHECK_INTERVAL = 10000;

const REJOIN_AFTER = 90000;


// =========================================
// ROBLOX WINDOW CONFIG
// =========================================

const SCREEN_WIDTH = 1280;

const SCREEN_HEIGHT = 720;

const WINDOW_WIDTH = 256;

const WINDOW_HEIGHT = 360;

const COLUMNS = 5;


// =========================================
// PACKAGES
// =========================================

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


// =========================================
// LOGGING (console saat startup, file saat dashboard aktif)
// =========================================

const LOG_FILE = "activity.log";

let VERBOSE = true; // true = tampil di console, false = hanya ke file (dashboard mode)

function log(...args) {

    const msg = args.length ? args.join(" ") : "";

    if (VERBOSE) {

        console.log(msg);

    }

    try {

        const line =
            msg === ""
                ? ""
                : `[${new Date().toLocaleTimeString()}] ${msg}`;

        fs.appendFileSync(LOG_FILE, line + "\n");

    } catch (e) {}

}


// =========================================
// STATUS DASHBOARD HELPERS
// =========================================

function setStatus(account, status) {

    account.status = status;

    account.statusSince = Date.now();

}

function presenceText(status) {

    switch (status) {

        case 0: return "Offline";
        case 1: return "Online";
        case 2: return "In Game";
        case 3: return "In Studio";
        default: return "Unknown";

    }

}

function pad(value, len) {

    const str = String(value);

    if (str.length >= len) {

        return str.slice(0, len - 1) + " ";

    }

    return str + " ".repeat(len - str.length);

}

function formatDuration(ms) {

    const totalSec = Math.max(0, Math.floor(ms / 1000));

    const m = Math.floor(totalSec / 60);

    const s = totalSec % 60;

    return `${m}m ${s}s`;

}

const COLORS = {

    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m"

};

function colorForStatus(status) {

    switch (status) {

        case "In Game":
            return COLORS.green;

        case "Offline":
        case "Timeout":
            return COLORS.red;

        case "Rejoin":
        case "Restart":
            return COLORS.yellow;

        case "Membuka":
        case "Menunggu Masuk":
        case "Online":
        case "In Studio":
            return COLORS.cyan;

        default:
            return COLORS.gray;

    }

}

function renderDashboard(accounts) {

    let out = "";

    out += "========================================\n";
    out += "        ROBLOX STATUS DASHBOARD\n";
    out += "========================================\n";

    out +=
        pad("SLOT", 6) +
        pad("USERNAME", 16) +
        pad("STATUS", 16) +
        pad("DURASI", 10) +
        "\n";

    out += "----------------------------------------------\n";

    accounts.forEach((acc, i) => {

        const durasi = formatDuration(
            Date.now() - (acc.statusSince || Date.now())
        );

        const statusPadded = pad(acc.status || "-", 16);

        const statusColored =
            colorForStatus(acc.status) +
            statusPadded +
            COLORS.reset;

        out +=
            pad(i + 1, 6) +
            pad(acc.username, 16) +
            statusColored +
            pad(durasi, 10) +
            "\n";

    });

    out += "========================================\n";

    out += `Update: ${new Date().toLocaleTimeString()}   | log lengkap: ${LOG_FILE}\n`;

    console.clear();

    process.stdout.write(out);

}


// =========================================
// READLINE
// =========================================

const rl = readline.createInterface({

    input: process.stdin,

    output: process.stdout

});


// =========================================
// ASK INPUT
// =========================================

function ask(question) {

    return new Promise(resolve => {

        rl.question(

            question,

            answer => {

                resolve(

                    answer.trim()

                );

            }

        );

    });

}


// =========================================
// EXEC SU COMMAND
// =========================================

function execSu(command) {

    return new Promise(resolve => {

        exec(

            `su -c "${command}"`,

            (err, stdout, stderr) => {

                if (err) {

                    log(
                        `[SU ERROR] ${err.message}`
                    );

                    if (stderr) {

                        log(
                            `[SU STDERR] ${stderr.trim()}`
                        );

                    }

                    resolve(null);

                    return;

                }

                resolve(

                    stdout.trim()

                );

            }

        );

    });

}


// =========================================
// SLEEP
// =========================================

function sleep(ms) {

    return new Promise(resolve => {

        setTimeout(

            resolve,

            ms

        );

    });

}


// =========================================
// EXTRACT PRIVATE SERVER CODE
// =========================================

function extractCode(link) {

    try {

        const url = new URL(link);

        const code =
            url.searchParams.get("code");

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

        const response =

            await axios.post(

                "https://users.roblox.com/v1/usernames/users",

                {

                    usernames: [

                        username

                    ],

                    excludeBannedUsers: false

                }

            );


        if (

            !response.data.data ||

            !response.data.data.length

        ) {

            return null;

        }


        return (

            response.data.data[0].id

        );


    } catch (err) {

        log(

            `[ERROR] Username lookup gagal: ${username}`

        );

        return null;

    }

}


// =========================================
// GET PRESENCE
// =========================================

async function getPresence(userId) {

    try {

        const response =

            await axios.post(

                "https://presence.roblox.com/v1/presence/users",

                {

                    userIds: [

                        userId

                    ]

                },

                {

                    timeout: 10000

                }

            );


        return (

            response.data.userPresences?.[0]

            || null

        );


    } catch (err) {

        log(

            `[${userId}] Presence error`

        );

        return null;

    }

}


// =========================================
// GET ROBLOX SLOT
// =========================================

function getRobloxSlot(account) {

    const index =

        packages.indexOf(

            account.package

        );


    if (index === -1) {

        return null;

    }


    const row =

        Math.floor(

            index / COLUMNS

        );


    const column =

        index % COLUMNS;


    const x =

        column *

        WINDOW_WIDTH;


    const y =

        row *

        WINDOW_HEIGHT;


    return {

        index,

        row,

        column,

        x,

        y,

        width:

            WINDOW_WIDTH,

        height:

            WINDOW_HEIGHT

    };

}


// =========================================
// GET TASK ID
// =========================================

async function getTaskId(packageName) {

    log("");

    log(

        `[${packageName}] Mencari Task ID...`

    );


    const output =

        await execSu(

            "dumpsys activity activities"

        );


    if (!output) {

        log(

            `[${packageName}] Gagal membaca dumpsys`

        );

        return null;

    }


    const escapedPackage =

        packageName.replace(

            /[.*+?^${}()|[\]\\]/g,

            "\\$&"

        );


    const regex =

        new RegExp(

            `Task id #(\\d+)[\\s\\S]{0,1000}?A=${escapedPackage}`,

            "m"

        );


    const match =

        output.match(

            regex

        );


    if (!match) {

        log("");

        log(

            `[${packageName}] ❌ Task ID tidak ditemukan`

        );

        return null;

    }


    const taskId =

        parseInt(

            match[1],

            10

        );


    log("");

    log(

        `[${packageName}] Task ID: ${taskId}`

    );


    return taskId;

}


// =========================================
// GET ROBLOX ACTIVITY STATE
// =========================================

async function debugRobloxWindow(packageName) {

    log("");

    log(

        `[${packageName}] ===== DEBUG WINDOW =====`

    );


    const output =

        await execSu(

            `dumpsys window windows | grep -i -A 35 -B 3 '${packageName}'`

        );


    if (!output) {

        log(

            `[${packageName}] Tidak ada output window`

        );

        return;

    }


    log("");

    log(output);

    log("");

    log(

        `[${packageName}] ===== END DEBUG =====`

    );

}


// =========================================
// FORCE ROBLOX FREEFORM
// =========================================

async function forceRobloxFreeform(

    packageName,

    taskId

) {

    log("");

    log(

        `[${packageName}] Mengaktifkan Freeform...`

    );


    log(

        `[${packageName}] Task ID: ${taskId}`

    );


    // =====================================
    // PINDAHKAN TASK KE FREEFORM
    // =====================================

    const command =

        `am task move-to-front ${taskId}`;

    
    log("");

    log(

        `[${packageName}] Move task to front:`

    );


    log(

        command

    );


    await execSu(

        command

    );


    await sleep(

        500

    );


    // =====================================
    // FORCE WINDOWING MODE 5
    // =====================================

    const freeformCommand =

        `am start --windowingMode 5 --activity-clear-top ` +

        `-n ${packageName}/com.roblox.client.ActivityProtocolLaunch`;


    log("");

    log(

        `[${packageName}] Freeform command:`

    );


    log(

        freeformCommand

    );


    const result =

        await execSu(

            freeformCommand

        );


    if (result === null) {

        log("");

        log(

            `[${packageName}] ⚠️ Freeform command error`

        );

    }


    await sleep(

        1000

    );


    return true;

}


// =========================================
// RESIZE ROBLOX
// =========================================

async function resizeRoblox(account) {

    const packageName =

        account.package;


    // =====================================
    // GET SLOT
    // =====================================

    const slot =

        getRobloxSlot(

            account

        );


    if (!slot) {

        log("");

        log(

            `[${packageName}] ❌ Slot tidak ditemukan`

        );

        return false;

    }


    log("");

    log(

        "========================================"

    );


    log(

        `[${packageName}] RESIZE ROBLOX`

    );


    log(

        `Slot     : ${slot.index + 1}/10`

    );


    log(

        `Position : ${slot.x},${slot.y}`

    );


    log(

        `Size     : ${slot.width}x${slot.height}`

    );


    log(

        "========================================"

    );


    // =====================================
    // GET TASK ID
    // =====================================

    let taskId =

        await getTaskId(

            packageName

        );


    if (!taskId) {

        log("");

        log(

            `[${packageName}] Task belum ditemukan`

        );


        return false;

    }


    // =====================================
    // FORCE FREEFORM
    // =====================================

    await forceRobloxFreeform(

        packageName,

        taskId

    );


    // =====================================
    // GET TASK ID ULANG
    // =====================================

    taskId =

        await getTaskId(

            packageName

        );


    if (!taskId) {

        log("");

        log(

            `[${packageName}] Task ID hilang setelah Freeform`

        );


        return false;

    }


    // =====================================
    // RESIZE TASK
    // =====================================

    const resizeCommand =

        `am task resize ${taskId} ` +

        `${slot.x} ` +

        `${slot.y} ` +

        `${slot.width} ` +

        `${slot.height}`;


    log("");

    log(

        `[${packageName}] Menjalankan resize...`

    );


    log("");

    log(

        `[COMMAND] ${resizeCommand}`

    );


    const result =

        await execSu(

            resizeCommand

        );


    if (result === null) {

        log("");

        log(

            `[${packageName}] ❌ Resize command gagal`

        );


        return false;

    }


    // =====================================
    // WAIT
    // =====================================

    await sleep(

        1000

    );


    // =====================================
    // DEBUG HASIL
    // =====================================

    log("");

    log(

        `[${packageName}] Mengecek hasil resize...`

    );


    await debugRobloxWindow(

        packageName

    );


    log("");

    log(

        `[${packageName}] ✅ Resize command selesai`

    );


    return true;

}


// =========================================
// OPEN ROBLOX
// PUBLIC / PRIVATE
// =========================================

function openRoblox(account) {

    return new Promise(resolve => {


        log("");

        log(

            `[${account.username}] Restart Roblox`

        );

        setStatus(account, "Membuka");


        // =================================
        // STOP ROBLOX
        // =================================

        exec(

            `su -c "am force-stop ${account.package}"`,

            err => {


                if (err) {

                    log(

                        `[${account.username}] Stop error: ${err.message}`

                    );

                } else {

                    log(

                        `[${account.username}] Roblox closed`

                    );

                }


                // =================================
                // WAIT
                // =================================

                setTimeout(() => {


                    let link;


                    // =================================
                    // PUBLIC
                    // =================================

                    if (

                        account.serverType ===

                        "public"

                    ) {


                        link =

                            `https://www.roblox.com/games/start?placeId=${account.placeId}`;


                        log("");

                        log(

                            `[${account.username}] Mode: PUBLIC`

                        );


                        log(

                            `[${account.username}] Place ID: ${account.placeId}`

                        );


                    }


                    // =================================
                    // PRIVATE
                    // =================================

                    else {


                        link =

                            `https://www.roblox.com/share?code=${account.serverCode}&type=Server`;


                        log("");

                        log(

                            `[${account.username}] Mode: PRIVATE SERVER`

                        );


                        log(

                            `[${account.username}] Server Code: ${account.serverCode}`

                        );


                    }


                    log("");

                    log(

                        `[${account.username}] Opening Roblox...`

                    );


                    log("");

                    log(

                        `[${account.username}] Link: ${link}`

                    );


                    // =================================
                    // OPEN ROBLOX
                    // =================================

                    const command =

                        `am start ` +

                        `-a android.intent.action.VIEW ` +

                        `-d "${link}" ` +

                        `-p ${account.package}`;


                    log("");

                    log(

                        `[DEBUG] ${command}`

                    );


                    exec(

                        command,

                        err => {


                            if (err) {


                                log("");

                                log(

                                    `[${account.username}] ❌ Open error: ${err.message}`

                                );


                                resolve(false);

                                return;

                            }


                            log("");

                            log(

                                `[${account.username}] ✅ Launch OK`

                            );


                            resolve(true);


                        }

                    );


                }, 3000);


            }

        );

    });

}


// =========================================
// WAIT UNTIL IN GAME
// =========================================

const WAIT_GAME_TIMEOUT = 120000; // 2 menit

function waitUntilInGame(account) {

    return new Promise(resolve => {

        log("");
        log(`[${account.username}] Menunggu masuk game...`);

        setStatus(account, "Menunggu Masuk");

        const started = Date.now();

        const check = setInterval(async () => {

            const presence = await getPresence(account.userId);

            if (!presence) {
                return;
            }

            const status = presence.userPresenceType;

            log(`[${account.username}] Presence: ${status}`);

            // Berhasil masuk game
            if (status === 2) {

                clearInterval(check);

                account.offlineSince = null;
                account.lastStatus = 2;

                setStatus(account, "In Game");

                log("");
                log(`[${account.username}] ✅ Berhasil masuk game`);

                resolve(true);
                return;
            }

            // Timeout
            if (Date.now() - started >= WAIT_GAME_TIMEOUT) {

                clearInterval(check);

                setStatus(account, "Timeout");

                log("");
                log(`[${account.username}] ❌ Timeout masuk game`);

                resolve(false);
            }

        }, CHECK_INTERVAL);

    });

}


// =========================================
// OPEN + WAIT + RESIZE
// =========================================

async function startAccount(account) {

    log("");

    log(

        "========================================"

    );

    log(

        `ROBLOX ${packages.indexOf(account.package) + 1}/${packages.length}`

    );

    log(

        `USERNAME: ${account.username}`

    );

    log(

        `PACKAGE: ${account.package}`

    );

    log(

        "========================================"

    );


    // =====================================
    // OPEN
    // =====================================

    const launched =

        await openRoblox(

            account

        );


    if (!launched) {

        log("");

        log(

            `[${account.username}] ❌ Gagal launch`

        );

        return false;

    }


    // =====================================
    // WAIT IN GAME
    // =====================================

    let success = await waitUntilInGame(account);

    while (!success) {

        log("");
        log(`[${account.username}] Force close lalu buka ulang...`);

        setStatus(account, "Restart");

        await execSu(`am force-stop ${account.package}`);
        await sleep(3000);

        const launched = await openRoblox(account);

        if (!launched) {
            await sleep(5000);
            continue;
        }

        success = await waitUntilInGame(account);
    }


    log("");

    log(

        `[${account.username}] ✅ Siap`

    );


    // =====================================
    // WAIT EXTRA
    // =====================================

    log("");

    log(

        `[${account.username}] Menunggu 2 detik sebelum resize...`

    );


    await sleep(

        2000

    );


    // =====================================
    // RESIZE
    // =====================================

    const resized =

        await resizeRoblox(

            account

        );


    if (!resized) {

        log("");

        log(

            `[${account.username}] ⚠️ Resize gagal`

        );

    } else {

        log("");

        log(

            `[${account.username}] ✅ Resize selesai`

        );

    }


    return true;

}


// =========================================
// MONITOR ACCOUNT
// =========================================

function monitorAccount(account) {


    log("");

    log(

        `[START] Monitoring ${account.username}`

    );


    setInterval(

        async () => {


            const presence =

                await getPresence(

                    account.userId

                );


            if (!presence) {

                return;

            }


            const status =

                presence.userPresenceType;


            const now =

                Date.now();


            // =====================================
            // IN GAME
            // =====================================

            if (status === 2) {


                if (

                    account.lastStatus !== 2

                ) {


                    setStatus(account, "In Game");

                    log(

                        `[${account.username}] ✅ In Game`

                    );


                }


                account.offlineSince =

                    null;


                account.lastStatus =

                    2;


                return;

            }


            // =====================================
            // STATUS BERUBAH
            // =====================================

            if (

                account.lastStatus !== status

            ) {


                setStatus(account, presenceText(status));

                log(

                    `[${account.username}] Status ${status}`

                );


                account.lastStatus =

                    status;


            }


            // =====================================
            // MULAI HITUNG OFFLINE
            // =====================================

            if (

                !account.offlineSince

            ) {


                account.offlineSince =

                    now;


                return;

            }


            // =====================================
            // HITUNG DURASI
            // =====================================

            const elapsed =

                now -

                account.offlineSince;


            // =====================================
            // REJOIN SETELAH 90 DETIK
            // =====================================

            if (

                elapsed >=

                REJOIN_AFTER

            ) {


                log("");

                log(

                    `[${account.username}] 🔄 Rejoin`

                );

                setStatus(account, "Rejoin");


                // =================================
                // REJOIN
                // =================================

                openRoblox(

                    account

                ).then(

                    async launched => {


                        if (!launched) {

                            return;

                        }


                        // =============================
                        // WAIT IN GAME
                        // =============================

                        let success = await waitUntilInGame(account);

                        while (!success) {

                            log(`[${account.username}] Timeout, restart Roblox...`);

                            setStatus(account, "Restart");

                            await execSu(`am force-stop ${account.package}`);
                            await sleep(3000);

                            const launched = await openRoblox(account);

                            if (!launched) {
                                await sleep(5000);
                                continue;
                            }

                            success = await waitUntilInGame(account);
                        }

                        await resizeRoblox(account);


                        log("");

                        log(

                            `[${account.username}] ✅ Rejoin + Resize selesai`

                        );


                    }

                );


                account.offlineSince =

                    now;


            }


        },

        CHECK_INTERVAL

    );

}


// =========================================
// CREATE CONFIG
// =========================================

async function createConfig() {


    const count =

        parseInt(

            await ask(

                "Berapa Roblox yang digunakan (1-10): "

            )

        );


    if (

        isNaN(count) ||

        count < 1 ||

        count > packages.length

    ) {


        console.log(

            "Jumlah harus 1-10"

        );


        process.exit(0);

    }


    const accounts = [];

    // =========================================
    // INPUT ACCOUNT
    // =========================================

    console.log("");
    console.log("========================================");
    console.log("PASTE SEMUA ACCOUNT");
    console.log("========================================");
    console.log("1 Baris = 1 Account");
    console.log("");
    console.log("Public : username-public-PLACE_ID");
    console.log("Private: username-LINK_PRIVATE_SERVER");
    console.log("");
    console.log("Contoh:");
    console.log("A7K2QX-public-97598239454123");
    console.log("M9R4TB-public-97598239454123");
    console.log("");
    console.log(`Paste ${count} account, lalu tekan CTRL+D jika selesai.`);
    console.log("========================================");

    // Tutup readline supaya stdin bisa dipakai langsung
    rl.close();

    const inputs = await new Promise(resolve => {

        let text = "";

        process.stdin.resume();
        process.stdin.setEncoding("utf8");

        process.stdin.on("data", chunk => {
            text += chunk;
        });

        process.stdin.on("end", () => {

            const lines = text
                .split(/\r?\n/)
                .map(v => v.trim())
                .filter(v => v.length > 0);

            resolve(lines);

        });

    });

    if (inputs.length !== count) {

        console.log("");
        console.log("Jumlah account tidak sesuai.");
        console.log(`Diminta     : ${count}`);
        console.log(`Dimasukkan  : ${inputs.length}`);

        process.exit(0);

    }

    for (let i = 0; i < inputs.length; i++) {

        const input = inputs[i];

        console.log("");
        console.log(`===== ROBLOX ${i + 1} =====`);
        console.log(`Package : ${packages[i]}`);

        // =====================================
        // PUBLIC
        // =====================================

        const publicMatch =
            input.match(/^([^-]+)-public-(\d+)$/);

        if (publicMatch) {

            const username = publicMatch[1].trim();
            const placeId = publicMatch[2].trim();

            console.log(`[${username}] Mode PUBLIC`);
            console.log(`Place ID: ${placeId}`);

            const userId = await usernameToUserId(username);

            if (!userId) {

                console.log("Username tidak ditemukan");
                process.exit(0);

            }

            accounts.push({

                package: packages[i],
                username: username,
                userId: userId,
                serverType: "public",
                placeId: placeId,
                serverCode: null,
                offlineSince: null,
                lastStatus: null,
                status: "Offline",
                statusSince: Date.now()

            });

            continue;

        }

        // =====================================
        // PRIVATE
        // =====================================

        const split = input.split("-");

        if (split.length < 2) {

            console.log(`Format salah pada baris ${i + 1}`);
            process.exit(0);

        }

        const username = split.shift().trim();
        const privateServer = split.join("-").trim();

        const userId = await usernameToUserId(username);

        if (!userId) {

            console.log("Username tidak ditemukan");
            process.exit(0);

        }

        accounts.push({

            package: packages[i],
            username: username,
            userId: userId,
            serverType: "private",
            placeId: null,
            serverCode: extractCode(privateServer),
            offlineSince: null,
            lastStatus: null,
            status: "Offline",
            statusSince: Date.now()

        });

    }


        // =========================================
        // SAVE CONFIG
        // =========================================

        fs.writeFileSync(

            CONFIG_FILE,

            JSON.stringify(

                accounts,

                null,

                2

            )

        );


        console.log("");

        console.log(

            "accounts.json dibuat"

        );


        return accounts;

    }


// =========================================
// LOAD CONFIG
// =========================================

async function loadAccounts() {


    if (

        fs.existsSync(

            CONFIG_FILE

        )

    ) {


        console.log(

            "Menggunakan accounts.json"

        );


        const data = JSON.parse(

            fs.readFileSync(

                CONFIG_FILE,

                "utf8"

            )

        );

        // pastikan field status ada (untuk accounts.json lama)
        data.forEach(acc => {

            if (!acc.status) acc.status = "Offline";

            if (!acc.statusSince) acc.statusSince = Date.now();

        });

        return data;


    }


    return await createConfig();

}


// =========================================
// MAIN
// =========================================

async function main() {


    // =========================================
    // LOAD ACCOUNTS
    // =========================================

    const accounts =

        await loadAccounts();


    rl.close();


    // =========================================
    // SHOW ACCOUNT
    // =========================================

    console.log("");

    console.log(

        "===== ACCOUNT ====="

    );


    for (

        const acc of accounts

    ) {


        console.log("");

        console.log(

            "Package:",

            acc.package

        );


        console.log(

            "Username:",

            acc.username

        );


        console.log(

            "UserId:",

            acc.userId

        );


        console.log(

            "Type:",

            acc.serverType

        );


        if (

            acc.serverType ===

            "public"

        ) {


            console.log(

                "Place ID:",

                acc.placeId

            );


        } else {


            console.log(

                "Code:",

                acc.serverCode

            );


        }


    }


    // =========================================
    // START
    // =========================================

    console.log("");

    console.log(

        "===== STARTING ROBLOX BERURUTAN ====="

    );


    // =========================================
    // OPEN ONE BY ONE
    // =========================================

    for (

        let i = 0;

        i < accounts.length;

        i++

    ) {


        const acc =

            accounts[i];


        await startAccount(

            acc

        );


        console.log("");

        console.log(

            `[${acc.username}] Lanjut membuka akun berikutnya...`

        );


    }


    // =========================================
    // ALL ACCOUNT READY
    // =========================================

    console.log("");

    console.log(

        "========================================"

    );


    console.log(

        "✅ SEMUA ROBLOX SUDAH MASUK GAME"

    );


    console.log(

        "========================================"

    );


    console.log("");

    console.log(

        "Mengaktifkan dashboard status dalam 3 detik..."

    );

    console.log(

        `Log detail selanjutnya disimpan ke: ${LOG_FILE}`

    );


    await sleep(3000);


    // =========================================
    // MULAI DASHBOARD (matikan log verbose di console)
    // =========================================

    VERBOSE = false;

    renderDashboard(accounts);

    setInterval(() => renderDashboard(accounts), 2000);


    // =========================================
    // START MONITORING
    // =========================================

    accounts.forEach(

        acc => {

            monitorAccount(

                acc

            );

        }

    );

}


// =========================================
// RUN
// =========================================

main();
