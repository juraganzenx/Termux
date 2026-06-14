// TERMUX AUTO REJOIN ROBLOX
const axios = require("axios");
const readline = require("readline");
const { exec } = require("child_process");
const fs = require("fs");

// =========================
// GAME LINK (BUKAN PRIVATE SERVER)
// =========================
const SERVER_LINK =
  "https://www.roblox.com/games/97598239454123";

const CHECK_INTERVAL = 15000; // 15 detik
const REJOIN_AFTER = 60000; // 60 detik

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
  console.log("[INFO] Membuka Roblox...");

  exec(
    `am start -a android.intent.action.VIEW -d "${SERVER_LINK}"`,
    (err) => {
      if (err) {
        console.log("[ERROR] Gagal membuka Roblox:", err.message);
      }
    }
  );
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

  // Buka game saat pertama dijalankan
  openRoblox();

  let offlineSince = null;
  let lastStatus = null;

  setInterval(async () => {
    const presence = await getPresence(userId);

    if (!presence) return;

    const status = presence.userPresenceType;

    /*
      0 = Offline
      1 = Online
      2 = In Game
      3 = In Studio
    */

    const now = Date.now();

    // Jika sedang di game
    if (status === 2) {
      if (lastStatus !== 2) {
        console.log(
          `[${new Date().toLocaleTimeString()}] ✅ Sedang di game`
        );
      }

      lastStatus = 2;
      offlineSince = null;
      return;
    }

    // Jika bukan di game
    if (lastStatus !== status) {
      console.log(
        `[${new Date().toLocaleTimeString()}] ⚠️ Tidak berada di game (status ${status})`
      );

      lastStatus = status;
    }

    if (offlineSince === null) {
      offlineSince = now;
      return;
    }

    const elapsed = now - offlineSince;

    if (elapsed >= REJOIN_AFTER) {
      console.log(
        `[${new Date().toLocaleTimeString()}] 🔄 Sudah 60 detik tidak berada di game, membuka game kembali...`
      );

      openRoblox();

      // Reset timer agar tidak spam membuka game
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
    `[INFO] Menggunakan User ID yang tersimpan: ${savedUserId}`
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