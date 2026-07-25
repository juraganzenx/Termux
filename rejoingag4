const { exec } = require("child_process");

const PACKAGE = "com.roblox.clienu";

function debugRobloxResize() {

    console.log("");
    console.log("========================================");
    console.log("DEBUG ROBLOX RESIZE");
    console.log("========================================");
    console.log("Package :", PACKAGE);
    console.log("");

    // Cek ukuran layar
    exec(
        `su -c "wm size"`,
        (err, stdout, stderr) => {

            console.log("[DEBUG] wm size:");

            if (err) {
                console.log("[ERROR]", err.message);
            } else {
                console.log(stdout);
            }

            console.log("");

            // Cek density
            exec(
                `su -c "wm density"`,
                (err, stdout, stderr) => {

                    console.log("[DEBUG] wm density:");

                    if (err) {
                        console.log("[ERROR]", err.message);
                    } else {
                        console.log(stdout);
                    }

                    console.log("");

                    // Cek window/activity
                    exec(
                        `su -c "dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp'"`,
                        (err, stdout, stderr) => {

                            console.log("[DEBUG] Current Focus:");

                            if (err) {
                                console.log("[ERROR]", err.message);
                            } else {
                                console.log(stdout);
                            }

                            console.log("");

                            // Coba start Roblox
                            exec(
                                `am start -n ${PACKAGE}/com.roblox.client.ActivityProtocolLaunch`,
                                (err, stdout, stderr) => {

                                    console.log("[DEBUG] Launch Result:");

                                    if (err) {
                                        console.log(
                                            "[ERROR]",
                                            err.message
                                        );
                                    } else {
                                        console.log(stdout);
                                    }

                                    console.log("");

                                    // Tunggu 5 detik
                                    setTimeout(() => {

                                        console.log(
                                            "[DEBUG] Cek window setelah Roblox dibuka..."
                                        );

                                        exec(
                                            `su -c "dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp'"`,
                                            (err, stdout) => {

                                                console.log(
                                                    stdout
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
                                        );

                                    }, 5000);

                                }
                            );

                        }
                    );

                }
            );

        }
    );

}

debugRobloxResize();
