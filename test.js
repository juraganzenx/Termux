//test
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

async function getTaskId(packageName) {

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

async function openRoblox(packageName) {

    console.log("");

    console.log(
        `[DEBUG] Membuka ${packageName}`
    );

    await execSu(
        `am start --windowingMode 5 -n ${packageName}/com.roblox.client.ActivityProtocolLaunch`
    );

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                5000
            )
    );

}

async function resizeRoblox(config) {

    const taskId = await getTaskId(
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

    const result = await execSu(
        command
    );

    if (result === null) {

        console.log(
            `[FAILED] ${config.package}`
        );

        return false;

    }

    console.log(
        `[SUCCESS] ${config.package}`
    );

    return true;

}

async function main() {

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "ROBLOX 2 WINDOW DEBUG"
    );

    console.log(
        "========================================"
    );

    // =====================================
    // BUKA ROBLOX 1
    // =====================================

    await openRoblox(
        ROBLOX[0].package
    );

    // =====================================
    // RESIZE ROBLOX 1
    // =====================================

    await resizeRoblox(
        ROBLOX[0]
    );

    // =====================================
    // BUKA ROBLOX 2
    // =====================================

    await openRoblox(
        ROBLOX[1].package
    );

    // =====================================
    // RESIZE ROBLOX 2
    // =====================================

    await resizeRoblox(
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
