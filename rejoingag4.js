// REJOINGAG3.aJS
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

                    console.log(
                        `[SU ERROR] ${err.message}`
                    );

                    if (stderr) {

                        console.log(
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

        console.log(

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

        console.log(

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

    console.log("");

    console.log(

        `[${packageName}] Mencari Task ID...`

    );


    const output =

        await execSu(

            "dumpsys activity activities"

        );


    if (!output) {

        console.log(

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

        console.log("");

        console.log(

            `[${packageName}] ❌ Task ID tidak ditemukan`

        );

        return null;

    }


    const taskId =

        parseInt(

            match[1],

            10

        );


    console.log("");

    console.log(

        `[${packageName}] Task ID: ${taskId}`

    );


    return taskId;

}


// =========================================
// GET ROBLOX ACTIVITY STATE
// =========================================

async function debugRobloxWindow(packageName) {

    console.log("");

    console.log(

        `[${packageName}] ===== DEBUG WINDOW =====`

    );


    const output =

        await execSu(

            `dumpsys window windows | grep -i -A 35 -B 3 '${packageName}'`

        );


    if (!output) {

        console.log(

            `[${packageName}] Tidak ada output window`

        );

        return;

    }


    console.log("");

    console.log(output);

    console.log("");

    console.log(

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

    console.log("");

    console.log(

        `[${packageName}] Mengaktifkan Freeform...`

    );


    console.log(

        `[${packageName}] Task ID: ${taskId}`

    );


    // =====================================
    // PINDAHKAN TASK KE FREEFORM
    // =====================================

    const command =

        `am task move-to-front ${taskId}`;

    
    console.log("");

    console.log(

        `[${packageName}] Move task to front:`

    );


    console.log(

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


    console.log("");

    console.log(

        `[${packageName}] Freeform command:`

    );


    console.log(

        freeformCommand

    );


    const result =

        await execSu(

            freeformCommand

        );


    if (result === null) {

        console.log("");

        console.log(

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

        console.log("");

        console.log(

            `[${packageName}] ❌ Slot tidak ditemukan`

        );

        return false;

    }


    console.log("");

    console.log(

        "========================================"

    );


    console.log(

        `[${packageName}] RESIZE ROBLOX`

    );


    console.log(

        `Slot     : ${slot.index + 1}/10`

    );


    console.log(

        `Position : ${slot.x},${slot.y}`

    );


    console.log(

        `Size     : ${slot.width}x${slot.height}`

    );


    console.log(

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

        console.log("");

        console.log(

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

        console.log("");

        console.log(

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


    console.log("");

    console.log(

        `[${packageName}] Menjalankan resize...`

    );


    console.log("");

    console.log(

        `[COMMAND] ${resizeCommand}`

    );


    const result =

        await execSu(

            resizeCommand

        );


    if (result === null) {

        console.log("");

        console.log(

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

    console.log("");

    console.log(

        `[${packageName}] Mengecek hasil resize...`

    );


    await debugRobloxWindow(

        packageName

    );


    console.log("");

    console.log(

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


        console.log("");

        console.log(

            `[${account.username}] Restart Roblox`

        );


        // =================================
        // STOP ROBLOX
        // =================================

        exec(

            `su -c "am force-stop ${account.package}"`,

            err => {


                if (err) {

                    console.log(

                        `[${account.username}] Stop error: ${err.message}`

                    );

                } else {

                    console.log(

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


                        console.log("");

                        console.log(

                            `[${account.username}] Mode: PUBLIC`

                        );


                        console.log(

                            `[${account.username}] Place ID: ${account.placeId}`

                        );


                    }


                    // =================================
                    // PRIVATE
                    // =================================

                    else {


                        link =

                            `https://www.roblox.com/share?code=${account.serverCode}&type=Server`;


                        console.log("");

                        console.log(

                            `[${account.username}] Mode: PRIVATE SERVER`

                        );


                        console.log(

                            `[${account.username}] Server Code: ${account.serverCode}`

                        );


                    }


                    console.log("");

                    console.log(

                        `[${account.username}] Opening Roblox...`

                    );


                    console.log("");

                    console.log(

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


                    console.log("");

                    console.log(

                        `[DEBUG] ${command}`

                    );


                    exec(

                        command,

                        err => {


                            if (err) {


                                console.log("");

                                console.log(

                                    `[${account.username}] ❌ Open error: ${err.message}`

                                );


                                resolve(false);

                                return;

                            }


                            console.log("");

                            console.log(

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

function waitUntilInGame(account) {

    return new Promise(resolve => {


        console.log("");

        console.log(

            `[${account.username}] Menunggu masuk game...`

        );


        const check =

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


                    console.log(

                        `[${account.username}] Presence: ${status}`

                    );


                    // =================================
                    // IN GAME
                    // =================================

                    if (status === 2) {


                        console.log("");

                        console.log(

                            `[${account.username}] ✅ Berhasil masuk game`

                        );


                        clearInterval(

                            check

                        );


                        account.offlineSince =

                            null;


                        account.lastStatus =

                            2;


                        resolve(true);


                    }


                },

                CHECK_INTERVAL

            );


    });

}


// =========================================
// OPEN + WAIT + RESIZE
// =========================================

async function startAccount(account) {

    console.log("");

    console.log(

        "========================================"

    );

    console.log(

        `ROBLOX ${packages.indexOf(account.package) + 1}/${packages.length}`

    );

    console.log(

        `USERNAME: ${account.username}`

    );

    console.log(

        `PACKAGE: ${account.package}`

    );

    console.log(

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

        console.log("");

        console.log(

            `[${account.username}] ❌ Gagal launch`

        );

        return false;

    }


    // =====================================
    // WAIT IN GAME
    // =====================================

    await waitUntilInGame(

        account

    );


    console.log("");

    console.log(

        `[${account.username}] ✅ Siap`

    );


    // =====================================
    // WAIT EXTRA
    // =====================================

    console.log("");

    console.log(

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

        console.log("");

        console.log(

            `[${account.username}] ⚠️ Resize gagal`

        );

    } else {

        console.log("");

        console.log(

            `[${account.username}] ✅ Resize selesai`

        );

    }


    return true;

}


// =========================================
// MONITOR ACCOUNT
// =========================================

function monitorAccount(account) {


    console.log("");

    console.log(

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


                    console.log(

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


                console.log(

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


                console.log("");

                console.log(

                    `[${account.username}] 🔄 Rejoin`

                );


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

                        await waitUntilInGame(

                            account

                        );


                        // =============================
                        // RESIZE ULANG
                        // =============================

                        await resizeRoblox(

                            account

                        );


                        console.log("");

                        console.log(

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

    for (

        let i = 0;

        i < count;

        i++

    ) {


        console.log("");

        console.log(

            `===== ROBLOX ${i + 1} =====`

        );


        console.log(

            `Package : ${packages[i]}`

        );


        console.log("");

        console.log(

            "Format Public : username-public-PLACE_ID"

        );


        console.log(

            "Format Private: username-LINK_PRIVATE_SERVER"

        );


        console.log("");


        const input =

            await ask(

                "USERNAME-SERVER : "

            );


        // =====================================
        // PUBLIC
        // =====================================

        const publicMatch =

            input.match(

                /^([^-]+)-public-(\d+)$/

            );


        if (publicMatch) {


            const username =

                publicMatch[1].trim();


            const placeId =

                publicMatch[2].trim();


            console.log("");

            console.log(

                `[${username}] Mode PUBLIC`

            );


            console.log(

                `Place ID: ${placeId}`

            );


            // =================================
            // GET USER ID
            // =================================

            const userId =

                await usernameToUserId(

                    username

                );


            if (!userId) {


                console.log(

                    "Username tidak ditemukan"

                );


                i--;

                continue;

            }


            accounts.push({

                package:

                    packages[i],

                username:

                    username,

                userId:

                    userId,

                serverType:

                    "public",

                placeId:

                    placeId,

                serverCode:

                    null,

                offlineSince:

                    null,

                lastStatus:

                    null

            });


            continue;

        }


        // =====================================
        // PRIVATE SERVER
        // =====================================

        const split =

            input.split("-");


        if (

            split.length < 2

        ) {


            console.log(

                "Format salah!"

            );


            i--;

            continue;

        }


        const username =

            split.shift().trim();


        const privateServer =

            split.join("-").trim();


        // =================================
        // GET USER ID
        // =================================

        const userId =

            await usernameToUserId(

                username

            );


        if (!userId) {


            console.log(

                "Username tidak ditemukan"

            );


            i--;

            continue;

        }


        accounts.push({

            package:

                packages[i],

            username:

                username,

            userId:

                userId,

            serverType:

                "private",

            placeId:

                null,

            serverCode:

                extractCode(

                    privateServer

                ),

            offlineSince:

                null,

            lastStatus:

                null

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


        return JSON.parse(

            fs.readFileSync(

                CONFIG_FILE,

                "utf8"

            )

        );


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

        "Monitoring berjalan..."

    );


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
