// // server.js (Upgraded for deep-parsed dataset)
// import express from "express";
// import bodyParser from "body-parser";
// import fs from "fs";
// import path from "path";
// import Fuse from "fuse.js";
// import cors from "cors";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import { fileURLToPath } from "url";

// import {
//   parseSchemeIncome,
//   parseUserIncome,
//   checkState,
//   checkGender,
//   checkIncome,
//   canonicalizeState,
//   norm
// } from "./utils.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(helmet());
// app.use(cors());
// app.use(bodyParser.json({ limit: "100kb" }));

// // Rate limit for safety
// app.use(
//   rateLimit({
//     windowMs: 60000,
//     max: 100
//   })
// );

// // ---------------------- LOAD DATASET ----------------------
// const DATA_PATH = path.join(__dirname, "output", "schemes_parsed.json");

// let schemes = [];
// try {
//   const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
//   schemes = raw;
//   console.log(`Loaded ${schemes.length} enriched schemes.`);
// } catch (err) {
//   console.error("Failed loading schemes:", err);
//   process.exit(1);
// }

// // ---------------------- SEARCH INDEXES ----------------------
// const fuse = new Fuse(schemes, {
//   includeScore: true,
//   threshold: 0.45,
//   keys: [
//     "scheme_name",
//     "details",
//     "benefits",
//     "raw_eligibility",
//     "schemeCategory",
//     "target_groups"
//   ]
// });

// // ---------------------- SMART USER PARSER ----------------------
// function simpleParse(text) {
//   if (!text) return {};

//   const t = text.toLowerCase();

//   // AGE
//   const ageMatch = t.match(/\b(\d{1,2})\s*(years?|yr|yrs)?\b/);
//   const age = ageMatch ? parseInt(ageMatch[1]) : null;

//   // GENDER
//   let gender = null;
//   if (/\bfemale|woman|girl\b/.test(t)) gender = "female";
//   if (/\bmale|man|boy\b/.test(t)) gender = "male";

//   // STATE
//   const state = canonicalizeState(t);

//   // INCOME
//   const income = parseUserIncome(t);

//   // TARGET GROUPS from user input
//   const tags = [];

//   if (/student|college|school/.test(t)) tags.push("student");
//   if (/farmer|agricultur/.test(t)) tags.push("farmer");
//   if (/pregnan|maternity/.test(t)) tags.push("pregnant_woman");
//   if (/widow/.test(t)) tags.push("widow");
//   if (/disabled|divyang|pwd/.test(t)) tags.push("disabled");
//   if (/sc\b/.test(t)) tags.push("SC");
//   if (/st\b|adivasi/.test(t)) tags.push("ST");
//   if (/obc/.test(t)) tags.push("OBC");
//   if (/ews/.test(t)) tags.push("EWS");
//   if (/minority/.test(t)) tags.push("Minority");
//   if (/urban/.test(t)) tags.push("urban");
//   if (/rural/.test(t)) tags.push("rural");
//   if (/entrepreneur|startup|msme/.test(t)) tags.push("entrepreneur");

//   return { age, gender, state, income, tags };
// }

// // ---------------------- MATCH LOGIC ----------------------
// function matchTargetGroups(userTags, schemeTags) {
//   if (!schemeTags || schemeTags.length === 0) return true;
//   if (!userTags || userTags.length === 0) return true;

//   const normalized = schemeTags.map(t => t.toLowerCase());
//   return userTags.some(tag => normalized.includes(tag.toLowerCase()));
// }

// function matchAge(userAge, schemeAge) {
//   if (!schemeAge) return true; // no constraint
//   if (!userAge) return true;

//   if (typeof schemeAge === "string" && schemeAge.includes("-")) {
//     const [min, max] = schemeAge.split("-").map(Number);
//     return userAge >= min && userAge <= max;
//   }

//   if (typeof schemeAge === "number") {
//     return userAge === schemeAge || userAge >= schemeAge;
//   }

//   return true;
// }
// function inferRequiredFields(scheme) {
//   const req = [];

//   // 1) Income explicitly mentioned → mandatory
//   if (scheme.income_limit !== null) {
//     req.push("income");
//   }

//   // 2) Age explicitly mentioned → mandatory
//   if (scheme.age_limit !== null) {
//     req.push("age");
//   }

//   // 3) Gender explicitly mentioned → mandatory 
//   if (scheme.gender === "female" || scheme.gender === "male") {
//     req.push("gender");
//   }

//   // 4) State-specific → mandatory 
//   if (scheme.state_or_scope && scheme.state_or_scope !== "All") {
//     req.push("state");
//   }

//   // 5) Disability restrictions
//   if (scheme.disability_types && scheme.disability_types.length > 0) {
//     req.push("disability");
//   }

//   // 6) Category restrictions
//   const socioTags = ["SC", "ST", "OBC", "EWS", "Minority"];
//   if (scheme.target_groups?.some(t => socioTags.includes(t))) {
//     req.push("caste");
//   }

//   // dedupe
//   return [...new Set(req)];
// }

// // ---------------------- RECOMMENDATION ----------------------
// app.post("/recommend", (req, res) => {
//   // Reject low-quality inputs
// if (req.body.text) {
//     const raw = req.body.text.toLowerCase();

//     const hasAge = /\b\d{1,2}\b/.test(raw);
//     const hasState = canonicalizeState(raw);
//     const hasIncome = parseUserIncome(raw);
//     const hasGender = raw.includes("female") || raw.includes("male");
//     const hasTag =
//         raw.includes("student") ||
//         raw.includes("farmer") ||
//         raw.includes("widow") ||
//         raw.includes("disabled") ||
//         raw.includes("obc") ||
//         raw.includes("sc") ||
//         raw.includes("st");

//     if (!hasAge && !hasState && !hasIncome && !hasGender && !hasTag) {
//         return res.json({
//             mode: "invalid_input",
//             items: [],
//             hint: "Please mention age, gender, state, or income.",
//         });
//     }
// }

//   const user = req.body.text ? simpleParse(req.body.text) : req.body;

//   // Build scoring-based FUSE shortlist first
//   const fuseResults = req.body.text
//     ? fuse.search(req.body.text).slice(0, 80).map(r => r.item)
//     : schemes.slice(0, 120);

//   // Attach required_fields automatically
//   const enriched = fuseResults.map(s => ({
//     ...s,
//     required_fields: s.required_fields || inferRequiredFields(s)
//   }));

//   // STRICT MATCHING
//   const strict = enriched.filter(s => {
//     const req = s.required_fields || [];

//     if (req.includes("age") && !matchAge(user.age, s.age_limit)) return false;
//     if (req.includes("gender") && !checkGender(user.gender, s.gender)) return false;
//     if (req.includes("income") && !checkIncome(user.income, parseSchemeIncome(s.income_limit))) return false;
//     if (req.includes("state") && !checkState(user.state, s.state_or_scope)) return false;

//     const casteTags = ["SC", "ST", "OBC", "EWS", "Minority"];
//     if (req.includes("caste") && !matchTargetGroups(user.tags, casteTags))
//       return false;

//     if (req.includes("disability") && !matchTargetGroups(user.tags, s.disability_types))
//       return false;

//     return true;
//   });

//   function score(s) {
//     let x = 0;
//     if (matchTargetGroups(user.tags, s.target_groups)) x += 30;
//     if (checkState(user.state, s.state_or_scope)) x += 15;
//     if (checkGender(user.gender, s.gender)) x += 10;
//     if (checkIncome(user.income, parseSchemeIncome(s.income_limit))) x += 10;
//     if (matchAge(user.age, s.age_limit)) x += 10;
//     return x;
//   }

//   function rank(list) {
//     return list
//       .map(s => ({ scheme: s, score: score(s) }))
//       .sort((a, b) => b.score - a.score)
//       .map(x => x.scheme);
//   }

//   // If STRICT works → return
//   if (strict.length > 0) {
//     return res.json({
//       items: rank(strict).slice(0, 15),
//       user,
//       mode: "strict"
//     });
//   }

//   // FAIL → fallback fuzzy relevance
//   const fallback = rank(fuseResults).slice(0, 8);

//   return res.json({
//     items: fallback,
//     user,
//     mode: fallback.length ? "fuzzy" : "none"
//   });
// });


// // ---------------------- SMART PARSE ENDPOINT ----------------------
// app.post("/parse", (req, res) => {
//   const text = req.body.text;
//   if (!text) return res.status(400).json({ error: "Missing text" });

//   const parsed = simpleParse(text);

//   // Additional semantic detections (based on enhanced dataset tags)
//   const t = text.toLowerCase();

//   // Social categories
//   if (/\bsc\b|scheduled caste/.test(t)) parsed.tags.push("SC");
//   if (/\bst\b|scheduled tribe|adivasi/.test(t)) parsed.tags.push("ST");
//   if (/obc|backward class/.test(t)) parsed.tags.push("OBC");
//   if (/ews/.test(t)) parsed.tags.push("EWS");
//   if (/minority|muslim|christian|sikh|buddhist|jain/.test(t)) parsed.tags.push("Minority");

//   // Occupation
//   if (/msme|startup|entrepreneur|self employ/.test(t)) parsed.tags.push("entrepreneur");
//   if (/artisan|handloom|weaver/.test(t)) parsed.tags.push("artisan");
//   if (/fisher/.test(t)) parsed.tags.push("fisherman");
//   if (/teacher|professor|lecturer/.test(t)) parsed.tags.push("teacher");

//   // Special population
//   if (/widow/.test(t)) parsed.tags.push("widow");
//   if (/pregnan|maternity/.test(t)) parsed.tags.push("pregnant_woman");
//   if (/disabled|divyang|pwd/.test(t)) parsed.tags.push("disabled");

//   // Residence
//   if (/rural|village|panchayat/.test(t)) parsed.tags.push("rural");
//   if (/urban|city|municipal|town/.test(t)) parsed.tags.push("urban");

//   parsed.tags = [...new Set(parsed.tags)]; // dedupe

//   res.json({ parsed });
// });

// // ---------------------- ROUTE: single scheme ----------------------
// app.get("/scheme/:slug", (req, res) => {
//   const slug = norm(req.params.slug);
//   const found = schemes.find(
//     s => norm(s.slug) === slug || norm(s.scheme_name) === slug
//   );
//   if (!found) return res.status(404).json({ error: "Not found" });
//   res.json(found);
// });

// // ---------------------- START SERVER ----------------------
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🔥 Recommender running on ${PORT}`));

// server.js (ESM version)

// import express from "express";
// import bodyParser from "body-parser";
// import { readFileSync } from "fs";
// import path from "path";
// import Fuse from "fuse.js";
// import cors from "cors";
// import { fileURLToPath } from "url";

// // __________ ES Module Fix for __dirname __________
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // -------------------------------------------------
// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// // ---------------------- Load Dataset ----------------------
// const DATA_PATH = path.join(__dirname, "output", "schemes_parsed.json");

// let schemes = [];
// try {
//   const raw = readFileSync(DATA_PATH, "utf8");
//   schemes = JSON.parse(raw);
//   console.log(`Loaded ${schemes.length} schemes.`);
// } catch (err) {
//   console.error("ERROR: Could not load schemes_parsed.json", err.message);
//   process.exit(1);
// }

// // ---------------------- Utility Helpers ----------------------
// function norm(s) {
//   return s ? String(s).trim().toLowerCase() : null;
// }

// function parseSchemeIncome(v) {
//   if (v === null || v === undefined) return null;
//   if (typeof v === "number") return v;
//   const s = String(v).toLowerCase().replace(/[,₹\s]/g, "");
//   if (s === "bpl") return -1;
//   const match = s.match(/\d+/);
//   return match ? parseInt(match[0]) : null;
// }

// function parseUserIncome(s) {
//   if (!s) return null;
//   s = String(s).toLowerCase();

//   if (s.includes("bpl")) return -1;

//   const lakh = s.match(/(\d+(\.\d+)?)\s*(lakh|lac)/i);
//   if (lakh) return Math.round(parseFloat(lakh[1]) * 100000);

//   const digits = s.replace(/[,₹\s]/g, "").match(/\d+/);
//   if (digits) {
//     const v = parseInt(digits[0]);
//     return v < 1000 ? null : v;
//   }
//   return null;
// }

// // ---------------------- Strict Matchers ----------------------
// function checkState(userState, schemeState) {
//   const us = norm(userState);
//   const ss = norm(schemeState);

//   if (!ss || ss === "all") return true;
//   if (!us) return false;

//   const tokens = ss.split(/[,;|]/).map(t => t.trim());
//   return tokens.includes(us);
// }

// function checkIncome(userIncome, schemeIncome) {
//   if (schemeIncome === null) return true;
//   if (schemeIncome === -1) return userIncome === -1;
//   if (userIncome === null) return true;
//   return userIncome <= schemeIncome;
// }

// function checkGender(userGender, schemeGender) {
//   const ug = norm(userGender);
//   const sg = norm(schemeGender);

//   if (!sg || sg === "any" || sg === "all") return true;
//   if (!ug) return false;

//   const map = {
//     male: ["male", "man", "men", "boy"],
//     female: ["female", "woman", "women", "girl"],
//   };

//   let schemeNorm = sg;
//   for (const [key, arr] of Object.entries(map)) {
//     if (arr.includes(sg)) schemeNorm = key;
//   }

//   let userNorm = ug;
//   for (const [key, arr] of Object.entries(map)) {
//     if (arr.includes(ug)) userNorm = key;
//   }

//   return schemeNorm === userNorm;
// }

// function checkTargets(userTags = [], schemeTargets = []) {
//   const u = userTags.map(norm);
//   const s = schemeTargets.map(norm);
//   return s.some(tag => u.includes(tag));
// }

// // ---------------------- Parser ----------------------
// function simpleParse(text) {
//   if (!text) return {};

//   const lower = text.toLowerCase();

//   const ageMatch = lower.match(/\b(\d{1,3})\s*(years?|yrs?|age)?\b/);
//   const age = ageMatch ? parseInt(ageMatch[1]) : null;

//   let gender = null;
//   if (/\b(boy|male|man|men)\b/.test(lower)) gender = "male";
//   if (/\b(girl|female|woman|women)\b/.test(lower)) gender = "female";

//   const states = {
//   andhra_pradesh: ["andhra pradesh", "andhra", "ap"],
//   arunachal_pradesh: ["arunachal pradesh", "arunachal"],
//   assam: ["assam", "as"],
//   bihar: ["bihar", "bh"],
//   chhattisgarh: ["chhattisgarh", "chattisgarh", "ct"],
//   goa: ["goa", "ga"],
//   gujarat: ["gujarat", "gj"],
//   haryana: ["haryana", "hr"],
//   himachal_pradesh: ["himachal pradesh", "himachal", "hp"],
//   jharkhand: ["jharkhand", "jh"],
//   karnataka: ["karnataka", "karntaka", "karnatka", "k'taka", "ka"],
//   kerala: ["kerala", "kl"],
//   madhya_pradesh: ["madhya pradesh", "mp"],
//   maharashtra: ["maharashtra", "mh"],
//   manipur: ["manipur", "mn"],
//   meghalaya: ["meghalaya", "ml"],
//   mizoram: ["mizoram", "mz"],
//   nagaland: ["nagaland", "nl"],
//   odisha: ["odisha", "orissa", "od"],
//   punjab: ["punjab", "pb"],
//   rajasthan: ["rajasthan", "rj"],
//   sikkim: ["sikkim", "sk"],
//   tamil_nadu: ["tamil nadu", "tamilnadu", "tn"],
//   telangana: ["telangana", "tg"],
//   tripura: ["tripura", "tr"],
//   uttar_pradesh: ["uttar pradesh", "up"],
//   uttarakhand: ["uttarakhand", "uttaranchal", "uk"],
//   west_bengal: ["west bengal", "westbengal", "wb"],
//   delhi: ["delhi", "nct", "dl"]
//   };

//   let state = null;
//   outer: for (const [std, aliases] of Object.entries(states)) {
//     for (const a of aliases) {
//       if (lower.includes(a)) {
//         state = std;
//         break outer;
//       }
//     }
//   }

//   const income = parseUserIncome(lower);

//   const tags = [];
//   if (/\bstudent\b|\bcollege\b/.test(lower)) tags.push("student");
//   if (/\bfarmer\b/.test(lower)) tags.push("farmer");
//   if (/\bbpl\b/.test(lower)) tags.push("bpl");
//   if (/\bsenior\b|\bold age\b/.test(lower)) tags.push("senior");
//   if (/\byouth\b/.test(lower)) tags.push("youth");
//   if (gender === "female") tags.push("women");

//   return { age, gender, income, state, tags };
// }

// // ---------------------- Fuse Setup ----------------------
// const fuseName = new Fuse(schemes, {
//   includeScore: true,
//   threshold: 0.25,
//   keys: ["scheme_name"],
// });

// const fuseBody = new Fuse(schemes, {
//   includeScore: true,
//   threshold: 0.45,
//   keys: ["details", "benefits", "raw_eligibility", "schemeCategory"],
// });

// // ---------------------- Routes ----------------------
// app.get("/", (req, res) => {
//   res.json({ status: "ok", total: schemes.length });
// });

// app.post("/parse", (req, res) => {
//   if (!req.body.text) return res.status(400).json({ error: "No text" });
//   res.json({ parsed: simpleParse(req.body.text) });
// });

// app.post("/recommend", (req, res) => {
//   const body = req.body;
//   const user = body.text ? simpleParse(body.text) : body;

//   let nameCandidates = [];
//   let bodyCandidates = [];

//   if (body.text) {
//     nameCandidates = fuseName.search(body.text).map(r => r.item).slice(0, 50);
//     bodyCandidates = fuseBody.search(body.text).map(r => r.item).slice(0, 200);
//   }

//   let candidates = [...new Set([...nameCandidates, ...bodyCandidates])];

//   if (candidates.length === 0) candidates = schemes;

//   const filtered = candidates.filter(s => {
//     if (!checkState(user.state, s.state_or_scope)) return false;
//     if (!checkGender(user.gender, s.gender)) return false;
//     if (!checkIncome(user.income, parseSchemeIncome(s.income_limit))) return false;
//     return true;
//   });

//   if (filtered.length === 0) {
//     const fallback = fuseBody.search(body.text || "").slice(0, 10).map(r => r.item);
//     return res.json({ count: fallback.length, items: fallback, fallback: true, user });
//   }

//   const scored = filtered.map(s => {
//     let score = 0;

//     if (checkState(user.state, s.state_or_scope)) score += 15;
//     if (checkGender(user.gender, s.gender)) score += 10;
//     if (checkIncome(user.income, parseSchemeIncome(s.income_limit))) score += 10;
//     if (checkTargets(user.tags, s.target_groups)) score += 30;

//     const e = norm(s.raw_eligibility || "");

//     if (user.age) {
//       if (user.age < 25 && e.includes("student")) score += 10;
//       if (user.age < 30 && e.includes("youth")) score += 10;
//       if (user.age > 60 && e.includes("senior")) score += 15;
//     }

//     if (!s.income_limit && (!s.gender || s.gender === "all") && s.state_or_scope === "All")
//       score -= 20;

//     return { scheme: s, score };
//   });

//   scored.sort((a, b) => b.score - a.score);
//   const topItems = scored.slice(0, 10).map(x => x.scheme);

//   res.json({ count: scored.length, items: topItems, user });
// });

// app.get("/scheme/:slug", (req, res) => {
//   const slug = norm(req.params.slug);
//   const found = schemes.find(
//     s =>
//       (s.slug && norm(s.slug) === slug) ||
//       (s.scheme_name && norm(s.scheme_name) === slug)
//   );

//   if (!found) return res.status(404).json({ error: "Not Found" });
//   res.json(found);
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ------------------ Load Data ------------------
const DATA_PATH = path.join(__dirname, 'output', 'schemes_parsed.json');

let schemes = [];
try {
  schemes = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  console.log(`Loaded ${schemes.length} schemes.`);
} catch (e) {
  console.error("Failed to load schemes_parsed.json");
  process.exit(1);
}

// ------------------ Helpers ------------------

// Parse scheme's income (may be integer, string, null, or -1)
function parseSchemeIncome(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;

  let s = String(value).toLowerCase().replace(/[,₹\s]/g, '');
  if (s === "bpl") return -1;

  const digits = s.match(/\d+/);
  if (digits) return parseInt(digits[0]);
  return null;
}

// User income parsing
function parseUserIncome(inp) {
  if (!inp) return null;

  const s = String(inp).toLowerCase();

  if (s.includes("bpl") || s.includes("below poverty")) return -1;

  const lakhMatch = s.match(/(\d+(\.\d+)?)\s*(lakh|lac)/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  const digits = s.replace(/[,₹\s]/g, "").match(/\d+/);
  if (digits) {
    const val = parseInt(digits[0], 10);
    if (val < 1000) return null;
    return val;
  }

  return null;
}

// SOFT income check
function checkIncome(userIncome, schemeIncome) {
  if (schemeIncome === null) return true;
  if (schemeIncome === -1) return userIncome === -1;
  if (userIncome === null) return true;
  return userIncome <= schemeIncome;
}

// SOFT state match
function checkState(userState, schemeState) {
  if (!schemeState || schemeState.toLowerCase() === "all") return true;
  if (!userState) return true;
  return schemeState.toLowerCase().includes(userState.toLowerCase());
}

// SOFT gender match
function checkGender(userGender, schemeGender) {
  if (!schemeGender) return true;
  if (!userGender) return true;
  const sg = schemeGender.toLowerCase();
  const ug = userGender.toLowerCase();
  if (sg === "any" || sg === "all") return true;
  return sg.includes(ug);
}

// RELAXED target matching
function checkTargets(userTags, schemeTargets) {
  if (!schemeTargets || schemeTargets.length === 0) return true;
  if (!userTags || userTags.length === 0) return true;

  const st = schemeTargets.map(s => s.toLowerCase());
  const ut = userTags.map(s => s.toLowerCase());

  return st.some(t => ut.includes(t));
}

// Quick regex-based parser
function simpleParse(text) {
  const t = text.toLowerCase();

  const ageMatch = t.match(/(\d{1,3})\s*(year|yr|yrs|years)?/);
  const age = ageMatch ? parseInt(ageMatch[1]) : null;

  let gender = null;
  if (t.match(/\b(female|woman|women|girl)\b/)) gender = "female";
  else if (t.match(/\b(male|man|boy|men)\b/)) gender = "male";

  const income = parseUserIncome(t);

  const states = [
    "karnataka","maharashtra","uttar pradesh","bihar","tamil nadu","kerala","gujarat",
    "rajasthan","west bengal","delhi","madhya pradesh","punjab","haryana","odisha",
    "andhra pradesh","telangana","assam","jharkhand"
  ];
  let state = null;
  for (const s of states) if (t.includes(s)) state = s;

  const tags = [];
  if (t.includes("student") || t.includes("scholar")) tags.push("student");
  if (t.includes("farmer") || t.includes("agricultur")) tags.push("farmer");
  if (t.includes("senior") || t.includes("old age") || t.includes("elder")) tags.push("senior");
  if (t.includes("disabled") || t.includes("divyang") || t.includes("pwd")) tags.push("disabled");
  if (t.includes("bpl") || t.includes("below poverty")) tags.push("bpl");
  if (t.includes("woman") || t.includes("female")) tags.push("women");

  return { age, gender, income, state, tags };
}

// ------------------ Fuzzy Search Setup ------------------
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  keys: [
    "scheme_name",
    "details",
    "benefits",
    "raw_eligibility",
    "tags",
    "schemeCategory"
  ]
};
const fuse = new Fuse(schemes, fuseOptions);

// ------------------ Endpoints ------------------

app.get("/", (req, res) => {
  res.json({ status: "ok", schemes: schemes.length });
});

// Parse endpoint
app.post("/parse", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text missing" });
  res.json({ parsed: simpleParse(text) });
});

app.post("/recommend", (req, res) => {
  const body = req.body;
  let user = {};
  const originalText = body.text ? body.text.toLowerCase().trim() : "";

  // common meaningless one-word texts
  const weakWords = ["hi", "hello", "hey", "scheme", "schemes", "help", "recommend", "money", "hello scheme"];

  // Quick bad input validation
  const hasAge = /\b\d{1,2}\b/.test(originalText);
  const hasIncome = parseUserIncome(originalText) !== null;
  const hasGender = originalText.includes("male") || originalText.includes("female");

  if (
    body.text &&
    (
      originalText.length < 5 ||
      weakWords.includes(originalText) ||
      (!hasAge && !hasIncome && !hasGender)
    )
  ) {
    return res.json({
      invalid: true,
      message:
        "Please give more details.\nExample:\n" +
        "\"I am a 21 year old female student from Karnataka with income 2 lakh\""
    });
  }

  // Parse user input
  if (body.text) user = simpleParse(body.text);
  else {
    user.age = body.age || null;
    user.gender = body.gender || null;
    user.income = parseUserIncome(body.income);
    user.state = body.state || null;
    user.tags = body.tags || [];
  }

  // FUSE SEARCH
  let candidates = schemes;
  if (body.text) {
    const fuseRes = fuse.search(body.text);
    if (fuseRes && fuseRes.length > 0) {
      candidates = fuseRes.slice(0, 200).map(r => r.item);
    }
  }

  // Strict filter (soft conditions)
  const filtered = candidates.filter(s => {
    return (
      checkIncome(user.income, parseSchemeIncome(s.income_limit)) &&
      checkState(user.state, s.state_or_scope) &&
      checkGender(user.gender, s.gender)
    );
  });

  if (filtered.length === 0) {
    const fallback = fuse.search(body.text || "").slice(0, 8).map(r => r.item);
    return res.json({
      fallback: true,
      count: fallback.length,
      items: fallback,
      user
    });
  }

  // ⭐ SCORE FUNCTION with keyword awareness
  function scoreScheme(scheme) {
    const text = originalText;

    let score = 0;

    // STRONG matching keywords
    if (text.includes("student") && scheme.target_groups?.includes("student")) score += 20;
    if (text.includes("farmer") && scheme.target_groups?.includes("farmer")) score += 20;
    if (text.includes("entrepreneur") && scheme.details?.toLowerCase().includes("entrepreneur")) score += 15;
    if (text.includes("scholarship") && scheme.schemeCategory?.toLowerCase().includes("scholar")) score += 25;

    // Base score (soft matching)
    if (checkTargets(user.tags, scheme.target_groups)) score += 5;
    if (checkState(user.state, scheme.state_or_scope)) score += 3;
    if (checkGender(user.gender, scheme.gender)) score += 2;
    if (checkIncome(user.income, parseSchemeIncome(scheme.income_limit))) score += 2;

    // Prefer concise readable schemes
    if (scheme.details && scheme.details.length < 300) score += 3;

    // Penalize schemes with no filtering criteria (too generic)
    if (!scheme.income_limit && (!scheme.gender || scheme.gender === "all") &&
        (scheme.state_or_scope === "All" || !scheme.state_or_scope)) score -= 5;

    return score;
  }

  // First scoring pass
  let scored = filtered.map(s => ({
    scheme: s,
    score: scoreScheme(s)
  }));

  // ⭐ Diversity Booster (avoid same ministry/state spam)
  function diversityAdjust(list) {
    const seenMinistry = new Set();
    const seenCategory = new Set();

    return list.map(item => {
      const min = (item.scheme.ministry || "").toLowerCase();
      const cat = (item.scheme.schemeCategory || "").toLowerCase();

      if (seenMinistry.has(min)) item.score -= 4; else seenMinistry.add(min);
      if (seenCategory.has(cat)) item.score -= 2; else seenCategory.add(cat);

      return item;
    });
  }

  scored = diversityAdjust(scored);

  scored.sort((a, b) => b.score - a.score);

  // ⭐ Shuffle ties (makes combinations different each time)
  function randomizeTie(list) {
    const result = [];
    let i = 0;

    while (i < list.length) {
      const baseScore = list[i].score;
      let group = [list[i]];
      let j = i + 1;

      while (j < list.length && list[j].score === baseScore) {
        group.push(list[j]);
        j++;
      }

      // Shuffle group
      group = group.sort(() => Math.random() - 0.5);

      result.push(...group);

      i = j;
    }

    return result;
  }

  scored = randomizeTie(scored);

  const topItems = scored.slice(0, 8).map(x => x.scheme);

  res.json({
    strict: true,
    count: scored.length,
    items: topItems,
    user
  });
});


// Get single scheme
app.get("/scheme/:slug", (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const found = schemes.find(s =>
    (s.slug && s.slug.toLowerCase() === slug) ||
    (s.scheme_name && s.scheme_name.toLowerCase() === slug)
  );
  if (!found) return res.status(404).json({ error: "scheme not found" });
  res.json(found);
});

const PDFDocument = require("pdfkit");


app.get("/pdf/:slug", (req, res) => {
  const slug = req.params.slug.toLowerCase();

  const scheme = schemes.find(
    s =>
      (s.slug && s.slug.toLowerCase() === slug) ||
      (s.scheme_name && s.scheme_name.toLowerCase() === slug)
  );

  if (!scheme) return res.status(404).json({ error: "Scheme not found" });

  const doc = new PDFDocument({ margin: 45 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(scheme.slug || "scheme")}_details.pdf"`
  );

  doc.pipe(res);

  // ---------- Title ----------
  doc.fontSize(22).fillColor("black").text(scheme.scheme_name, { underline: true });
  doc.moveDown(1.5);

  doc.fontSize(14).fillColor("#444").text("REQUIRED DOCUMENTS", { bold: true });
  doc.moveDown(0.5);

  // Normalize documents
  let docs = [];

  if (Array.isArray(scheme.documents)) {
    docs = scheme.documents;
  } else if (typeof scheme.documents === "string") {
    docs = scheme.documents.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
  }

  if (docs.length === 0) {
    doc.fontSize(12).text("• No document information available");
  } else {
    docs.forEach(d => doc.fontSize(12).text(`• ${d}`));
  }

  doc.moveDown(2);

  // ---------- Eligibility Section ----------
  if (scheme.raw_eligibility) {
    doc.fontSize(14).fillColor("#444").text("ELIGIBILITY SUMMARY", { bold: true });
    doc.moveDown(0.5);

    // smart split on `. ` or newline
    const eligibilityPoints = scheme.raw_eligibility
      .split(/[\n.]+/)
      .map(t => t.trim())
      .filter(Boolean);

    eligibilityPoints.forEach(point => {
      doc.fontSize(12).fillColor("black").text(`• ${point}`);
    });

    doc.moveDown(2);
  }

  // ---------- Application Section ----------
  if (scheme.application) {
    doc.fontSize(14).fillColor("#444").text("HOW TO APPLY", { bold: true });
    doc.moveDown(0.5);

    const steps = scheme.application
      .split(/[\n.]+/)
      .map(t => t.trim())
      .filter(Boolean);

    steps.forEach((step, i) => {
      doc.fontSize(12).fillColor("black").text(`${i + 1}. ${step}`);
    });

    doc.moveDown(2);
  }

  // ---------- Website Link ----------
  if (scheme.url) {
    doc.fontSize(14).fillColor("#444").text("OFFICIAL APPLICATION LINK", { bold: true });
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor("blue").text(
      scheme.url,
      { link: scheme.url, underline: true }
    );
  }

  doc.end();
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});