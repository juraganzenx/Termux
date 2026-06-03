const axios = require("axios");
const readline = require("readline");
const { exec } = require("child_process");

const SERVER_LINK =
  "https://www.roblox.com/share?code=d054a5cbdfd8fc4ea5227439273e9f01&type=Server";

const CHECK_INTERVAL = 15000; // 15 detik
const REJOIN_AFTER = 60000; // 60 detik

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

rl.question("Masukkan User ID Roblox: ", async (userId) => {
  if (!userId || isNaN(userId)) {
    console.log("User ID tidak valid.");
    process.exit(1);
  }

  console.log(`[INFO] Monitoring User ID ${userId}`);

  openRoblox();

  let offlineSince = null;

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

    if (status === 2) {
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ Sedang di game`
      );

      offlineSince = null;
      return;
    }

    console.log(
      `[${new Date().toLocaleTimeString()}] ⚠️ Tidak berada di game (status ${status})`
    );

    if (!offlineSince) {
      offlineSince = now;
      return;
    }

    const elapsed = now - offlineSince;

    if (elapsed >= REJOIN_AFTER) {
      console.log(
        "[REJOIN] Tidak berada di game lebih dari 60 detik. Rejoin..."
      );

      openRoblox();

      offlineSince = now;
    }
  }, CHECK_INTERVAL);
});
