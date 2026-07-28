const { exec } = require("child_process");

const ROBLOX = [
    {
        package: "com.roblox.clienu",
        x: 0,
        y: 0,
        width: 256,
        height: 360
    },
    {
        package: "com.roblox.clienv",
        x: 256,
        y: 0,
        width: 256,
        height: 360
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
// GET TASK ID
// =========================================

async function getTaskId(packageName) {

    console.log("");

    console.log(
        `[DEBUG] Mencari Task ID: ${packageName}`
    );


    const output = await execSu(
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


    const regex = new RegExp(
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
        `[DEBUG] Task ID: ${taskId}`
    );


    return taskId;

}


// =========================================
// OPEN ROBLOX FULLSCREEN
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


    // =====================================
    // FORCE STOP
    // =====================================

    await execSu(
        `am force-stop ${packageName}`
    );


    await wait(
        1000
    );


    // =====================================
    // OPEN NORMAL / FULLSCREEN
    // =====================================

    console.log(
        `[DEBUG] Launch fullscreen ${packageName}`
    );


    await execSu(
        `am start -n ${packageName}/com.roblox.client.ActivityProtocolLaunch`
    );


    // =====================================
    // TUNGGU ROBLOX LOAD
    // =====================================

    console.log(
        "[DEBUG] Menunggu Roblox fullscreen..."
    );


    await wait(
        7000
    );

}


// =========================================
// RESIZE
// =========================================

async function resizeRoblox(config) {

    const taskId =
        await getTaskId(
            config.package
        );


    if (!taskId) {

        return false;

    }


    console.log("");

    console.log(
        `[DEBUG] Resize ${config.package}`
    );

    console.log(
        `Task ID : ${taskId}`
    );

    console.log(
        `X       : ${config.x}`
    );

    console.log(
        `Y       : ${config.y}`
    );

    console.log(
        `Width   : ${config.width}`
    );

    console.log(
        `Height  : ${config.height}`
    );


    const command =
        `am task resize ${taskId} ` +
        `${config.x} ` +
        `${config.y} ` +
        `${config.width} ` +
        `${config.height}`;


    console.log("");

    console.log(
        `[DEBUG] ${command}`
    );


    const result =
        await execSu(
            command
        );


    if (result === null) {

        console.log(
            `[FAILED] Resize ${config.package}`
        );

        return false;

    }


    console.log("");

    console.log(
        `[SUCCESS] Resize command dikirim ke ${config.package}`
    );


    return true;

}


// =========================================
// OPEN + RESIZE
// =========================================

async function openAndResize(config) {

    await openRoblox(
        config.package
    );


    await resizeRoblox(
        config
    );

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
        "ROBLOX FULLSCREEN -> RESIZE DEBUG"
    );

    console.log(
        "========================================"
    );


    // =====================================
    // ROBLOX 1
    // =====================================

    await openAndResize(
        ROBLOX[0]
    );


    // =====================================
    // ROBLOX 2
    // =====================================

    await openAndResize(
        ROBLOX[1]
    );


    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "SELESAI"
    );

    console.log(
        "========================================"
    );

}


main();
