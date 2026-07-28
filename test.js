const { exec } = require("child_process");

const WINDOW_WIDTH = 256;
const WINDOW_HEIGHT = 360;

const COLUMNS = 5;

const ROBLOXES = [
    {
        package: "com.roblox.clienu"
    },
    {
        package: "com.roblox.clienv"
    },
    {
        package: "com.roblox.clienw"
    },
    {
        package: "com.roblox.clienx"
    },
    {
        package: "com.roblox.clieny"
    },
    {
        package: "com.roblox.clienz"
    },
    {
        package: "com.roblox.cliens"
    },
    {
        package: "com.roblox.clienr"
    },
    {
        package: "com.roblox.clienq"
    },
    {
        package: "com.roblox.clienp"
    }
];


// =========================================
// EXEC SU COMMAND
// =========================================

function execSu(command) {

    return new Promise((resolve) => {

        exec(
            `su -c "${command}"`,
            (err, stdout, stderr) => {

                if (err) {

                    console.log(
                        "[ERROR]",
                        err.message
                    );

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
// GET ROBLOX SLOT
// =========================================

function getRobloxSlot(index) {

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

        x: x,

        y: y,

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
        `[DEBUG] Mencari Task ID: ${packageName}`
    );


    const output =
        await execSu(
            "dumpsys activity activities"
        );


    if (!output) {

        console.log(
            "[ERROR] dumpsys tidak menghasilkan output"
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

        console.log(
            `[ERROR] Task ID ${packageName} tidak ditemukan`
        );

        return null;

    }


    const taskId =
        parseInt(
            match[1],
            10
        );


    console.log(
        `[DEBUG] ${packageName} Task ID: ${taskId}`
    );


    return taskId;

}


// =========================================
// OPEN ROBLOX
// =========================================

async function openRoblox(packageName) {

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        `[DEBUG] Membuka ${packageName}`
    );

    console.log(
        "========================================"
    );


    const result =
        await execSu(
            `am start --windowingMode 5 -n ${packageName}/com.roblox.client.ActivityProtocolLaunch`
        );


    if (result === null) {

        console.log(
            `[FAILED] Gagal membuka ${packageName}`
        );

        return false;

    }


    console.log(
        `[SUCCESS] ${packageName} berhasil dibuka`
    );


    return true;

}


// =========================================
// RESIZE ROBLOX
// =========================================

async function resizeRoblox(
    packageName,
    x,
    y,
    width,
    height
) {

    const taskId =
        await getTaskId(
            packageName
        );


    if (!taskId) {

        return false;

    }


    console.log("");

    console.log(
        `[DEBUG] Resize ${packageName}`
    );

    console.log(
        `Task ID : ${taskId}`
    );

    console.log(
        `X       : ${x}`
    );

    console.log(
        `Y       : ${y}`
    );

    console.log(
        `Width   : ${width}`
    );

    console.log(
        `Height  : ${height}`
    );


    const command =
        `am task resize ${taskId} ` +
        `${x} ` +
        `${y} ` +
        `${width} ` +
        `${height}`;


    console.log("");

    console.log(
        `[DEBUG] Command: ${command}`
    );


    const result =
        await execSu(
            command
        );


    if (result !== null) {

        console.log("");

        console.log(
            `[SUCCESS] ${packageName} berhasil di-resize`
        );


        return true;

    }


    console.log("");

    console.log(
        `[FAILED] Gagal resize ${packageName}`
    );


    return false;

}


// =========================================
// WAIT
// =========================================

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


// =========================================
// OPEN + RESIZE 1 ROBLOX
// =========================================

async function startRoblox(
    roblox,
    index
) {

    const packageName =
        roblox.package;


    const slot =
        getRobloxSlot(
            index
        );


    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        `ROBLOX ${index + 1}/10`
    );

    console.log(
        `PACKAGE: ${packageName}`
    );

    console.log(
        `POSITION: ${slot.x}, ${slot.y}`
    );

    console.log(
        `SIZE: ${slot.width}x${slot.height}`
    );

    console.log(
        "========================================"
    );


    // =====================================
    // OPEN
    // =====================================

    const opened =
        await openRoblox(
            packageName
        );


    if (!opened) {

        return false;

    }


    // =====================================
    // WAIT TASK
    // =====================================

    console.log("");

    console.log(
        `[DEBUG] Menunggu Task ${packageName}...`
    );


    await wait(
        5000
    );


    // =====================================
    // RESIZE
    // =====================================

    const resized =
        await resizeRoblox(
            packageName,
            slot.x,
            slot.y,
            slot.width,
            slot.height
        );


    if (!resized) {

        console.log("");

        console.log(
            `[FAILED] ${packageName} gagal di-resize`
        );

        return false;

    }


    console.log("");

    console.log(
        `[SUCCESS] ROBLOX ${index + 1} SELESAI`
    );


    return true;

}


// =========================================
// MAIN
// =========================================

async function main() {

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "ROBLOX 10 RESIZE DEBUG"
    );

    console.log(
        "5 COLUMNS x 2 ROWS"
    );

    console.log(
        "WINDOW 256x360"
    );

    console.log(
        "SCREEN 1280x720"
    );

    console.log(
        "========================================"
    );


    // =====================================
    // OPEN ROBLOX SATU PER SATU
    // =====================================

    for (
        let i = 0;
        i < ROBLOXES.length;
        i++
    ) {

        await startRoblox(
            ROBLOXES[i],
            i
        );

    }


    // =====================================
    // SELESAI
    // =====================================

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "SEMUA ROBLOX SELESAI"
    );

    console.log(
        "========================================"
    );

}


// =========================================
// RUN
// =========================================

main();
