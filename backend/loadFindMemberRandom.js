// // Usage: node loadFindMemberRandom.js <TOTAL_REQUESTS> <CONCURRENCY> <BASE_URL>
// const axios = require("axios");
// const fs = require("fs");

// const TOTAL = parseInt(process.argv[2] || "200", 10); // total requests to send
// const CONCURRENCY = parseInt(process.argv[3] || "10", 10); // parallel workers
// const BASE_URL = process.argv[4] || "https://aoa-certificate.onrender.com";

// // config
// const REQUEST_TIMEOUT = 7000; // ms
// const MIN_DELAY_MS = 50;
// const MAX_DELAY_MS = 350;

// let FLATS = [];
// try {
//   FLATS = fs
//     .readFileSync("flatnumbers.txt", "utf-8")
//     .split("\n")
//     .map((line) => line.trim())
//     .filter((line) => line.length > 0);
// } catch (err) {
//   console.error("Error reading flats file:", err.message);
//   process.exit(1);
// }

// if (FLATS.length === 0) {
//   console.error("No flat numbers loaded from file!");
//   process.exit(1);
// }

// function randomInt(min, max) {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomFlatFromDB() {
//   const idx = Math.floor(Math.random() * FLATS.length);
//   return FLATS[idx];
// }

// // function randomFlat() {
// //   const towers = "ABCDFGHIJKLMNOPQR"; // skipping "E"
// //   const letter = towers[randomInt(0, towers.length - 1)];
// //   const floor = randomInt(0, 21); // 0th to 21st floor
// //   const unit = randomInt(1, 4); // assume 4 flats per floor
// //   const flatNum = `${floor.toString().padStart(2, "0")}${unit.toString().padStart(2, "0")}`;
// //   return `${letter}-${flatNum}`;
// // }

// // Delay workers
// async function sleep(ms) {
//   return new Promise((r) => setTimeout(r, ms));
// }

// // ---- Worker ----
// async function worker(id, requestsToDo, results, latencies) {
//   for (let i = 0; i < requestsToDo; i++) {
//     const flat = randomFlatFromDB();
//     const start = Date.now();
//     try {
//       const res = await axios.post(BASE_URL, { flatNumber: flat }, { timeout: REQUEST_TIMEOUT, headers: { "Content-Type": "application/json" } });

//       const duration = Date.now() - start;
//       latencies.push(duration);
//       if (res.status >= 200 && res.status < 300) {
//         results.success++;
//         // console.log(`[w${id}] OK ${res.status} ${flat}`);
//       } else {
//         results.non2xx++;
//         console.warn(`[w${id}] NON2XX ${res.status} ${flat}`);
//       }
//     } catch (err) {
//       const duration = Date.now() - start;
//       latencies.push(duration);
//       const status = err.response?.status;

//       if (status === 400 || status === 404) {
//         results.notFound++;
//         console.warn(`[w${id}] NOT_FOUND ${status} ${flat}`);
//       } else {
//         results.errors++;
//         const code = status || err.code || err.message;
//         console.error(`[w${id}] ERR ${code} ${flat}`);
//       }
//     }

//     // implement delay
//     const delay = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
//     await sleep(delay);
//   }
// }

// // latency check function
// function computeStats(latencies) {
//   if (latencies.length === 0) return {};

//   const sorted = [...latencies].sort((a, b) => a - b);
//   const sum = sorted.reduce((a, b) => a + b, 0);
//   const avg = sum / sorted.length;

//   function percentile(p) {
//     const idx = Math.floor((p / 100) * sorted.length);
//     return sorted[Math.min(idx, sorted.length - 1)];
//   }

//   return {
//     count: sorted.length,
//     min: sorted[0],
//     max: sorted[sorted.length - 1],
//     avg: avg.toFixed(2),
//     p50: percentile(50),
//     p95: percentile(95),
//   };
// }

// IIFE
// (async () => {
//   console.log(`Starting test -> TOTAL=${TOTAL}, CONCURRENCY=${CONCURRENCY}, endpoint=${BASE_URL}`);
//   console.log(`Loaded ${FLATS.length} flats from file: "flatnumbers.txt"`);
//   const perWorker = Math.ceil(TOTAL / CONCURRENCY);
//   let results = { success: 0, errors: 0, non2xx: 0, notFound: 0 };

//   let latencies = [];
//   const workers = [];
//   for (let i = 0; i < CONCURRENCY; i++) {
//     workers.push(worker(i + 1, perWorker, results, latencies));
//   }

//   const start = Date.now();
//   await Promise.all(workers);
//   const duration = (Date.now() - start) / 1000;

//   console.log("---- DONE ----");
//   console.log(`Duration: ${duration}s`);
//   console.log(`Total attempts (approx): ${perWorker * CONCURRENCY}`);
//   console.log(`Successes: ${results.success}`);
//   console.log(`Not found (non-existing members): ${results.notFound}`);
//   console.log(`Non-2xx responses: ${results.non2xx}`);
//   console.log(`Errors (timeouts/other): ${results.errors}`);

//   const stats = computeStats(latencies);
//   console.log("Latency stats (ms):", stats);
// })();
