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

        console.log("");
        console.log(`[CMD] su -c "${command}"`);

        exec(
            `su -c "${command}"`,
            (err, stdout, stderr) => {

                if (err) {

                    console.log(
                        `[ERROR] ${err.message}`
                    );

                    if (stderr) {

                        console.log(
                            `[STDERR] ${stderr.trim()}`
                        );

                    }

                    resolve(null);

                    return;

                }

                if (stdout) {

                    console.log(
                        `[STDOUT] ${stdout.trim()}`
                    );

                }

                if (stderr) {

                    console.log(
                        `[STDERR] ${stderr.trim()}`
                    );

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

    console.log("");
    console.log(
        "========================================"
    );

    console.log(
        `[DEBUG] MENCARI TASK ID`
    );

    console.log(
        `[DEBUG] Package: ${packageName}`
    );

    console.log(
        "========================================"
    );


    const output = await execSu(
        "dumpsys activity activities"
    );


    if (!output) {

        console.log(
            "[ERROR] dumpsys activity kosong"
        );

        return null;

    }


    // =====================================
    // CARI SEMUA TASK YANG MENGANDUNG PACKAGE
    // =====================================

    const taskRegex =
        /Task id #(\d+)[\s\S]*?(?=Task id #\d+|Running activities|$)/g;


    const matches = [];

    let match;


    while (
        (match = taskRegex.exec(output)) !== null
    ) {

        const taskBlock =
            match[0];

        const taskId =
            match[1];


        if (
            taskBlock.includes(
                packageName
            )
        ) {

            matches.push({

                taskId:
                    parseInt(
                        taskId,
                        10
                    ),

                block:
                    taskBlock

            });

        }

    }


    // =====================================
    // TIDAK DITEMUKAN
    // =====================================

    if (
        matches.length === 0
    ) {

        console.log("");
        console.log(
            `[ERROR] Tidak menemukan Task ID untuk ${packageName}`
        );

        return null;

    }


    // =====================================
    // TAMPILKAN HASIL
    // =====================================

    console.log("");

    console.log(
        `[DEBUG] Ditemukan ${matches.length} task`
    );


    matches.forEach(
        (item, index) => {

            console.log("");

            console.log(
                `[TASK ${index + 1}]`
            );

            console.log(
                `Task ID: ${item.taskId}`
            );

            const activityMatch =
                item.block.match(
                    /mActivityComponent=([^\s]+)/ 
                );


            if (
                activityMatch
            ) {

                console.log(
                    `Activity: ${activityMatch[1]}`
                );

            }

        }
    );


    // =====================================
    // AMBIL TASK TERAKHIR
    // =====================================

    const selected =
        matches[
            matches.length - 1
        ];


    console.log("");

    console.log(
        `[DEBUG] Task ID dipilih: ${selected.taskId}`
    );


    return selected.taskId;

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

    console.log("");
    console.log(
        "========================================"
    );

    console.log(
        `[RESIZE] ${packageName}`
    );

    console.log(
        "========================================"
    );


    const taskId =
        await getTaskId(
            packageName
        );


    if (!taskId) {

        console.log(
            `[FAILED] Task ID tidak ditemukan: ${packageName}`
        );

        return false;

    }


    console.log("");

    console.log(
        "[DEBUG] Parameter Resize"
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
        `am task resize ` +
        `${taskId} ` +
        `${x} ` +
        `${y} ` +
        `${width} ` +
        `${height}`;


    console.log("");

    console.log(
        `[DEBUG] Menjalankan resize`
    );


    const result =
        await execSu(
            command
        );


    if (
        result === null
    ) {

        console.log("");

        console.log(
            `[FAILED] Resize gagal: ${packageName}`
        );

        return false;

    }


    console.log("");

    console.log(
        `[SUCCESS] Resize command berhasil: ${packageName}`
    );


    return true;

}


// =========================================
// OPEN ROBLOX
// =========================================

async function openRoblox(
    packageName
) {

    console.log("");
    console.log(
        "========================================"
    );

    console.log(
        `[OPEN] ${packageName}`
    );

    console.log(
        "========================================"
    );


    // =====================================
    // FORCE STOP
    // =====================================

    console.log(
        `[DEBUG] Force stop ${packageName}`
    );


    await execSu(
        `am force-stop ${packageName}`
    );


    // =====================================
    // WAIT
    // =====================================

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                1000
            )
    );


    // =====================================
    // OPEN FREEFORM
    // =====================================

    console.log(
        `[DEBUG] Membuka ${packageName} dengan Windowing Mode 5`
    );


    const result =
        await execSu(
            `am start --windowingMode 5 -n ${packageName}/com.roblox.client.ActivityProtocolLaunch`
        );


    if (
        result === null
    ) {

        console.log(
            `[FAILED] Gagal membuka ${packageName}`
        );

        return false;

    }


    console.log(
        `[SUCCESS] Launch command selesai`
    );


    return true;

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
// CHECK WINDOW
// =========================================

async function checkWindow(
    packageName
) {

    console.log("");
    console.log(
        "========================================"
    );

    console.log(
        `[CHECK WINDOW] ${packageName}`
    );

    console.log(
        "========================================"
    );


    const output =
        await execSu(
            `dumpsys window windows | grep -i "${packageName}" -A 25`
        );


    if (!output) {

        console.log(
            `[ERROR] Window ${packageName} tidak ditemukan`
        );

        return;

    }


    console.log("");

    console.log(
        output
    );

}


// =========================================
// START ROBLOX
// =========================================

async function startRoblox(
    roblox,
    index
) {

    console.log("");
    console.log("");
    console.log(
        "########################################"
    );

    console.log(
        `ROBLOX ${index + 1}/2`
    );

    console.log(
        `PACKAGE: ${roblox.package}`
    );

    console.log(
        `TARGET : ${roblox.x},${roblox.y}`
    );

    console.log(
        `SIZE   : ${roblox.width}x${roblox.height}`
    );

    console.log(
        "########################################"
    );


    // =====================================
    // OPEN
    // =====================================

    const opened =
        await openRoblox(
            roblox.package
        );


    if (!opened) {

        return;

    }


    // =====================================
    // WAIT ROBLOX
    // =====================================

    console.log("");

    console.log(
        `[DEBUG] Menunggu 5 detik...`
    );


    await wait(
        5000
    );


    // =====================================
    // RESIZE
    // =====================================

    await resizeRoblox(

        roblox.package,

        roblox.x,

        roblox.y,

        roblox.width,

        roblox.height

    );


    // =====================================
    // CHECK WINDOW
    // =====================================

    await wait(
        1000
    );


    await checkWindow(
        roblox.package
    );


    console.log("");

    console.log(
        `[DEBUG] ${roblox.package} selesai`
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
        "ROBLOX 2 RESIZE DEBUG V2"
    );

    console.log(
        "========================================"
    );


    // =====================================
    // ROBLOX 1
    // =====================================

    await startRoblox(
        ROBLOXES[0],
        0
    );


    // =====================================
    // ROBLOX 2
    // =====================================

    await startRoblox(
        ROBLOXES[1],
        1
    );


    // =====================================
    // SELESAI
    // =====================================

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "DEBUG SELESAI"
    );

    console.log(
        "========================================"
    );

}


main();
