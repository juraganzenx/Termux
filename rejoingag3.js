//REJOIN GAG2 MULTI PS

const axios = require("axios");
const readline = require("readline");
const { exec } = require("child_process");
const fs = require("fs");

// =========================https://www.roblox.com/share?code=f47d43513419b445b5d8373271213ca4&type=Server
// PRIVATE SERVERS
// =========================
const SERVERS = [
  "https://www.roblox.com/share?code=36d9b3e78a9dd04888662908230d803f&type=Server", //SANGJUKIE
  "https://www.roblox.com/share?code=6b9fbe28b269684f87c0115bab7ca23c&type=Server", //OTOOKO
  "https://www.roblox.com/share?code=03ceb8edb9f2064c8ca67022010c7822&type=Server", //AIRINMERAH
  "https://www.roblox.com/share?code=f47d43513419b445b5d8373271213ca4&type=Server", //1ottoko

];

let currentServer = 0;

// =========================
// SETTINGS
// =========================
const CHECK_INTERVAL = 10000; // cek presence setiap 10 detik
const REJOIN_AFTER = 30000; // ganti server setelah 30 detik

const USER_FILE = "userid.txt";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// =========================
// SAVE / LOAD USER ID
// =========================
function getSavedUserId() {
  try {
    if (fs.existsSync(USER_FILE)) {
      return fs.readFileSync(USER_FILE, "utf8").trim();
    }
  } catch (e) {
    console.log("[ERROR] Gagal membaca User ID:", e.message);
  }

  return null;
}

function saveUserId(userId) {
  try {
    fs.writeFileSync(USER_FILE, String(userId));
    console.log("[INFO] User ID berhasil disimpan.");
  } catch (e) {
    console.log("[ERROR] Gagal menyimpan User ID:", e.message);
  }
}

// =========================
// OPEN ROBLOX
// =========================
function openRoblox() {
  const link = SERVERS[currentServer];

  console.log(
    `[INFO] Membuka Private Server ${currentServer + 1}`
  );

  exec(
    `am start -a android.intent.action.VIEW -d "${link}"`,
    (err) => {
      if (err) {
        console.log("[ERROR] Gagal membuka Roblox:", err.message);
      }
    }
  );
}

// =========================
// NEXT SERVER
// =========================
function nextServer() {
  currentServer = (currentServer + 1) % SERVERS.length;

  console.log(
    `[INFO] Berpindah ke Private Server ${currentServer + 1}`
  );

  openRoblox();
}

// =========================
// GET PRESENCE
// =========================
async function getPresence(userId) {
  try {
    const response = await axios.post(
      "https://presence.roblox.com/v1/presence/users",
      {
        userIds: [Number(userId)],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return response.data.userPresences?.[0] || null;
  } catch (err) {
    console.log("[ERROR] Presence API:", err.message);
    return null;
  }
}

// =========================
// START MONITOR
// =========================
function startMonitoring(userId) {
  console.log(`[INFO] Monitoring User ID ${userId}`);

  openRoblox();

  let offlineSince = null;
  let lastStatus = null;

  setInterval(async () => {
    const presence = await getPresence(userId);

    if (!presence) return;

    const status = presence.userPresenceType;
    const now = Date.now();

    /*
      0 = Offline
      1 = Online
      2 = In Game
      3 = In Studio
    */

    // =========================
    // IN GAME
    // =========================
    if (status === 2) {
      if (lastStatus !== 2) {
        console.log(
          `[${new Date().toLocaleTimeString()}] ✅ Berhasil masuk game`
        );
      }

      lastStatus = 2;
      offlineSince = null;
      return;
    }

    // =========================
    // NOT IN GAME
    // =========================
    if (lastStatus !== status) {
      console.log(
        `[${new Date().toLocaleTimeString()}] ⚠️ Belum berada di game (status ${status})`
      );
      lastStatus = status;
    }

    if (!offlineSince) {
      offlineSince = now;
      return;
    }

    const elapsed = now - offlineSince;

    if (elapsed >= REJOIN_AFTER) {
      console.log(
        `[${new Date().toLocaleTimeString()}] 🔄 Gagal masuk game selama ${
          REJOIN_AFTER / 1000
        } detik`
      );

      nextServer();

      offlineSince = now;
    }
  }, CHECK_INTERVAL);
}

// =========================
// MAIN
// =========================
const savedUserId = getSavedUserId();

if (savedUserId && !isNaN(savedUserId)) {
  console.log(
    `[INFO] Menggunakan User ID tersimpan: ${savedUserId}`
  );

  rl.close();
  startMonitoring(savedUserId);
} else {
  rl.question("Masukkan User ID Roblox: ", (userId) => {
    if (!userId || isNaN(userId)) {
      console.log("User ID tidak valid.");
      process.exit(1);
    }

    saveUserId(userId);

    rl.close();

    startMonitoring(userId);
  });
}