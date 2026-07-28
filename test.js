//tes
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


    // =====================================
    // ESCAPE PACKAGE
    // =====================================

    const escapedPackage =
        packageName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );


    // =====================================
    // CARI TASK ID
    // =====================================

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
        `[DEBUG] Task ID ditemukan: ${taskId}`
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


    // =====================================
    // COMMAND SAMA SEPERTI CLienU
    // =====================================

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
// OPEN + RESIZE ROBLOX
// =========================================

async function openAndResize(
    config
) {

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        `MEMBUKA ${config.package}`
    );

    console.log(
        "========================================"
    );


    // =====================================
    // OPEN FREEFORM
    // =====================================

    console.log("");

    console.log(
        `[DEBUG] Membuka ${config.package}`
    );


    await execSu(
        `am start --windowingMode 5 -n ${config.package}/com.roblox.client.ActivityProtocolLaunch`
    );


    // =====================================
    // WAIT TASK
    // SAMA SEPERTI VERSI YANG BERHASIL
    // =====================================

    console.log("");

    console.log(
        "[DEBUG] Menunggu Task Roblox..."
    );


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                5000
            )
    );


    // =====================================
    // RESIZE
    // =====================================

    await resizeRoblox(
        config.package,
        config.x,
        config.y,
        config.width,
        config.height
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
