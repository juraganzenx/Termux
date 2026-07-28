const { exec } = require("child_process");

const ROBLOXES = [
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

                resolve(stdout.trim());

            }
        );

    });

}


// =========================================
// GET TASK ID
// =========================================

async function getTaskId(packageName) {

    console.log(
        `[DEBUG] Mencari Task ID: ${packageName}`
    );

    const output = await execSu(
        `dumpsys activity activities`
    );

    if (!output) {

        console.log(
            "[ERROR] dumpsys tidak menghasilkan output"
        );

        return null;

    }


    const escapedPackage = packageName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );


    const regex = new RegExp(
        `Task id #(\\d+)[\\s\\S]{0,1000}?A=${escapedPackage}`,
        "m"
    );


    const match = output.match(regex);


    if (!match) {

        console.log(
            `[ERROR] Task ID ${packageName} tidak ditemukan`
        );

        return null;

    }


    const taskId = parseInt(
        match[1],
        10
    );


    console.log(
        `[DEBUG] ${packageName} Task ID: ${taskId}`
    );


    return taskId;

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

    const taskId = await getTaskId(
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
        `am task resize ${taskId} ${x} ${y} ${width} ${height}`;


    console.log("");

    console.log(
        `[DEBUG] Command: ${command}`
    );


    const result = await execSu(
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
// OPEN ROBLOX
// =========================================

async function openRoblox(packageName) {

    console.log("");

    console.log(
        `[DEBUG] Membuka ${packageName}`
    );


    await execSu(
        `am start --windowingMode 5 -n ${packageName}/com.roblox.client.ActivityProtocolLaunch`
    );


    console.log(
        `[DEBUG] ${packageName} dibuka`
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
        "ROBLOX 2 RESIZE DEBUG"
    );

    console.log(
        "========================================"
    );


    // =====================================
    // BUKA ROBLOX 1
    // =====================================

    await openRoblox(
        ROBLOXES[0].package
    );


    console.log("");

    console.log(
        "[DEBUG] Tunggu Roblox 1..."
    );


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                5000
            )
    );


    // =====================================
    // RESIZE ROBLOX 1
    // =====================================

    await resizeRoblox(
        ROBLOXES[0].package,
        ROBLOXES[0].x,
        ROBLOXES[0].y,
        ROBLOXES[0].width,
        ROBLOXES[0].height
    );


    // =====================================
    // BUKA ROBLOX 2
    // =====================================

    await openRoblox(
        ROBLOXES[1].package
    );


    console.log("");

    console.log(
        "[DEBUG] Tunggu Roblox 2..."
    );


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                5000
            )
    );


    // =====================================
    // RESIZE ROBLOX 2
    // =====================================

    await resizeRoblox(
        ROBLOXES[1].package,
        ROBLOXES[1].x,
        ROBLOXES[1].y,
        ROBLOXES[1].width,
        ROBLOXES[1].height
    );


    // =====================================
    // SELESAI
    // =====================================

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
