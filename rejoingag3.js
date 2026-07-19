const axios = require("axios");
const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const CONFIG_FILE = "accounts.json";

const CHECK_INTERVAL = 10000;
const REJOIN_AFTER = 90000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}


// Ambil code dari link private server
function extractCode(link) {

    try {

        const url = new URL(link);

        const code = url.searchParams.get("code");

        if (code) {
            return code;
        }

    } catch {}

    return link.trim();
}


// Username Roblox -> UserId
async function usernameToUserId(username) {

    try {

        const response = await axios.post(
            "https://users.roblox.com/v1/usernames/users",
            {
                usernames: [username],
                excludeBannedUsers: false
            }
        );


        if (!response.data.data.length) {
            return null;
        }


        return response.data.data[0].id;


    } catch(err) {

        console.log(
            `[ERROR] Username lookup gagal ${username}`
        );

        return null;
    }
}


// Cek status Roblox
async function getPresence(userId) {

    try {

        const response = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            {
                userIds:[userId]
            },
            {
                timeout:10000
            }
        );


        return response.data.userPresences?.[0] || null;


    } catch(err){

        console.log(
            `[${userId}] Presence error`
        );

        return null;
    }
}



// Open Roblox Private Server
function openRoblox(account) {


    const link =
    `https://www.roblox.com/share?code=${account.serverCode}&type=Server`;


    console.log("");
    console.log(
        `[${account.username}] Restart Roblox`
    );


    // STOP ROBLOX ROOT
    exec(
        `su -c "am force-stop ${account.package}"`,
        (err)=>{


            if(err){

                console.log(
                    `[${account.username}] Stop error ${err.message}`
                );

            } else {

                console.log(
                    `[${account.username}] Roblox closed`
                );

            }



            // tunggu sebelum buka lagi
            setTimeout(()=>{


                console.log(
                    `[${account.username}] Opening private server`
                );


                exec(
                    `am start -a android.intent.action.VIEW -d "${link}" -p ${account.package}`,
                    (err)=>{


                        if(err){

                            console.log(
                                `[${account.username}] Open error ${err.message}`
                            );

                            return;
                        }


                        console.log(
                            `[${account.username}] Launch OK`
                        );


                    }
                );


            },3000);



        }
    );

}



// Monitoring akun
function monitorAccount(account){


    console.log(
        `[START] Monitoring ${account.username}`
    );


    // buka pertama kali
    openRoblox(account);



    setInterval(async()=>{


        const presence =
        await getPresence(account.userId);



        if(!presence){
            return;
        }


        const status =
        presence.userPresenceType;



        const now = Date.now();



        /*
            0 Offline
            1 Online
            2 In Game
            3 Studio
        */



        if(status === 2){


            if(account.lastStatus !== 2){

                console.log(
                    `[${account.username}] ✅ In Game`
                );

            }


            account.offlineSince = null;
            account.lastStatus = 2;


            return;

        }



        if(account.lastStatus !== status){


            console.log(
                `[${account.username}] Status ${status}`
            );


            account.lastStatus=status;

        }




        if(!account.offlineSince){

            account.offlineSince = now;

            return;

        }



        const elapsed =
        now - account.offlineSince;



        if(elapsed >= REJOIN_AFTER){


            console.log(
                `[${account.username}] 🔄 Rejoin`
            );


            openRoblox(account);


            account.offlineSince = now;

        }



    },CHECK_INTERVAL);



}



// Buat config baru
async function createConfig(){

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

    const count = parseInt(
        await ask("Berapa Roblox yang digunakan (1-10): ")
    );

    if(isNaN(count) || count < 1 || count > packages.length){
        console.log("Jumlah harus 1-10");
        process.exit(0);
    }

    const accounts = [];

    for(let i = 0; i < count; i++){

        console.log("");
        console.log(`===== ROBLOX ${i+1} =====`);
        console.log(`Package : ${packages[i]}`);

        const input = await ask(
            "USERNAME-LINKPS : "
        );

        const split = input.split("-");

        if(split.length < 2){
            console.log("Format salah!");
            i--;
            continue;
        }

        const username = split.shift().trim();
        const privateServer = split.join("-").trim();

        const userId = await usernameToUserId(username);

        if(!userId){
            console.log("Username tidak ditemukan");
            i--;
            continue;
        }

        accounts.push({

            package: packages[i],

            username: username,

            userId: userId,

            serverCode: extractCode(privateServer),

            offlineSince: null,

            lastStatus: null

        });

    }

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(accounts, null, 2)
    );

    console.log("accounts.json dibuat");

    return accounts;

}



// Load config
async function loadAccounts(){


    if(fs.existsSync(CONFIG_FILE)){


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



// Main
async function main(){


    const accounts =
    await loadAccounts();



    rl.close();



    console.log("");
    console.log(
        "===== ACCOUNT ====="
    );



    for(const acc of accounts){


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
            "Code:",
            acc.serverCode
        );


    }



    console.log("");
    console.log(
        "Monitoring berjalan..."
    );



    accounts.forEach(
        (acc,index)=>{


            setTimeout(()=>{

                monitorAccount(acc);

            },index*5000);


        }
    );


}



main();
