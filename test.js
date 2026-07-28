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

                resolve(stdout.trim());

            }
        );

    });

}


// =========================================
// WAIT
// =========================================

function wait(ms) {

    return new Promise(
        resolve => setTimeout(
            resolve,
            ms
        )
    );

}


// =========================================
// GET ALL TASKS
// =========================================

async function getAllTasks(packageName) {

    console.log("");

    console.log(
        `[DEBUG] Mencari semua Task ${packageName}`
    );

    const output = await execSu(
        "dumpsys activity activities"
    );

    if (!output) {

        console.log(
            "[ERROR] dumpsys gagal"
        );

        return [];

    }


    const lines =
        output.split("\n");


    const tasks = [];


    let currentTaskId = null;

    let currentBlock = "";


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        const taskMatch =
            line.match(
                /Task id #(\d+)/
            );


        if (taskMatch) {

            if (
                currentTaskId !== null &&
                currentBlock.includes(
                    packageName
                )
            ) {

                tasks.push(
                    currentTaskId
                );

            }


            currentTaskId =
                parseInt(
                    taskMatch[1],
                    10
                );


            currentBlock =
                line;


            continue;

        }


        if (
            currentTaskId !== null
        ) {

            currentBlock +=
                "\n" +
                line;

        }

    }


    // =====================================
    // CEK TASK TERAKHIR
    // =====================================

    if (
        currentTaskId !== null &&
        currentBlock.includes(
            packageName
        )
    ) {

        tasks.push(
            currentTaskId
        );

    }


    // =====================================
    // REMOVE DUPLICATE
    // =====================================

    const uniqueTasks =
        [...new Set(tasks)];


    console.log("");

    console.log(
        `[DEBUG] ${packageName} memiliki ${uniqueTasks.length} Task`
    );


    for (
        const taskId of uniqueTasks
    ) {

        console.log(
            `[DEBUG] Task ditemukan: ${taskId}`
        );

    }


    return uniqueTasks;

}


// =========================================
// GET ACTIVE TASK
// =========================================

async function getActiveTask(
    packageName
) {

    console.log("");

    console.log(
        `[DEBUG] Mencari Task aktif ${packageName}`
    );


    const output = await execSu(
        "dumpsys activity activities"
    );


    if (!output) {

        return null;

    }


    const lines =
        output.split("\n");


    let currentTaskId =
        null;


    let currentBlock =
        "";


    const candidates = [];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        const taskMatch =
            line.match(
                /Task id #(\d+)/
            );


        if (taskMatch) {

            if (
                currentTaskId !== null &&
                currentBlock.includes(
                    packageName
                )
            ) {

                candidates.push({
                    taskId:
                        currentTaskId,

                    block:
                        currentBlock
                });

            }


            currentTaskId =
                parseInt(
                    taskMatch[1],
                    10
                );


            currentBlock =
                line;


            continue;

        }


        if (
            currentTaskId !== null
        ) {

            currentBlock +=
                "\n" +
                line;

        }

    }


    if (
        currentTaskId !== null &&
        currentBlock.includes(
            packageName
        )
    ) {

        candidates.push({
            taskId:
                currentTaskId,

            block:
                currentBlock
        });

    }


    if (
        candidates.length === 0
    ) {

        console.log(
            `[ERROR] Tidak ada Task ${packageName}`
        );

        return null;

    }


    // =====================================
    // PRINT CANDIDATES
    // =====================================

    console.log("");

    console.log(
        `[DEBUG] Candidate Task ${packageName}:`
    );


    for (
        const candidate of candidates
    ) {

        const resumed =
            candidate.block.includes(
                "mResumedActivity"
            );


        console.log(
            `Task ${candidate.taskId}` +
            (
                resumed
                    ? " <-- RESUMED"
                    : ""
            )
        );

    }


    // =====================================
    // PRIORITAS TASK TERAKHIR
    // =====================================

    const selected =
        candidates[
            candidates.length - 1
        ];


    console.log("");

    console.log(
        `[DEBUG] Menggunakan Task ID: ${selected.taskId}`
    );


    return selected.taskId;

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
        `[DEBUG] OPEN ${packageName}`
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


    await wait(
        1000
    );


    // =====================================
    // START FREEFORM
    // =====================================

    console.log(
        `[DEBUG] Start Freeform ${packageName}`
    );


    await execSu(
        `am start --windowingMode 5 -n ${packageName}/com.roblox.client.ActivityProtocolLaunch`
    );


    console.log(
        `[DEBUG] Menunggu Roblox...`
    );


    await wait(
        7000
    );

}


// =========================================
// RESIZE
// =========================================

async function resizeRoblox(
    config
) {

    const taskId =
        await getActiveTask(
            config.package
        );


    if (!taskId) {

        console.log(
            `[FAILED] Task ${config.package} tidak ditemukan`
        );

        return false;

    }


    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        `[DEBUG] RESIZE ${config.package}`
    );

    console.log(
        `Task   : ${taskId}`
    );

    console.log(
        `X      : ${config.x}`
    );

    console.log(
        `Y      : ${config.y}`
    );

    console.log(
        `Width  : ${config.width}`
    );

    console.log(
        `Height : ${config.height}`
    );

    console.log(
        "========================================"
    );


    // =====================================
    // FORCE RESIZE
    // =====================================

    const command =
        `am task resize ` +
        `${taskId} ` +
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


    if (
        result === null
    ) {

        console.log(
            `[FAILED] Resize ${config.package}`
        );

        return false;

    }


    console.log("");

    console.log(
        `[SUCCESS] Resize command dikirim`
    );


    // =====================================
    // TUNGGU
    // =====================================

    await wait(
        2000
    );


    // =====================================
    // CEK WINDOW
    // =====================================

    console.log("");

    console.log(
        `[DEBUG] Mengecek Window ${config.package}`
    );


    const windowOutput =
        await execSu(
            `dumpsys window windows | grep -i "${config.package}" -A 20`
        );


    if (
        windowOutput
    ) {

        console.log("");

        console.log(
            windowOutput
        );

    }


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
        "ROBLOX 2 RESIZE DEBUG"
    );

    console.log(
        "========================================"
    );


    // =====================================
    // ROBLOX 1
    // =====================================

    await openRoblox(
        ROBLOX[0].package
    );


    await resizeRoblox(
        ROBLOX[0]
    );


    // =====================================
    // ROBLOX 2
    // =====================================

    await openRoblox(
        ROBLOX[1].package
    );


    await resizeRoblox(
        ROBLOX[1]
    );


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
