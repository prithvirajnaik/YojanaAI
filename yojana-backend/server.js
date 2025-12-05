const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ------------------ AI Setup ------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "API_KEY_MISSING");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    "karnataka", "maharashtra", "uttar pradesh", "bihar", "tamil nadu", "kerala", "gujarat",
    "rajashtra", "west bengal", "delhi", "madhya pradesh", "punjab", "haryana", "odisha",
    "andhra pradesh", "telangana", "assam", "jharkhand"
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

  // STRICT FILTERING (income, state, gender)
  const filtered = candidates.filter(s => {
    const schemeGender = (s.gender || "").toLowerCase();
    const userGender = (user.gender || "").toLowerCase();

    // STRICT GENDER FILTER:
    if (userGender) {
      if (userGender === "female" && schemeGender === "male") return false;
      if (userGender === "male" && schemeGender === "female") return false;
    }

    return (
      checkIncome(user.income, parseSchemeIncome(s.income_limit)) &&
      checkState(user.state, s.state_or_scope)
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

    if (text.includes("student") && scheme.target_groups?.includes("student")) score += 20;
    if (text.includes("farmer") && scheme.target_groups?.includes("farmer")) score += 20;
    if (text.includes("entrepreneur") && scheme.details?.toLowerCase().includes("entrepreneur")) score += 15;
    if (text.includes("scholarship") && scheme.schemeCategory?.toLowerCase().includes("scholar")) score += 25;

    if (checkTargets(user.tags, scheme.target_groups)) score += 5;
    if (checkState(user.state, scheme.state_or_scope)) score += 3;
    if (checkIncome(user.income, parseSchemeIncome(scheme.income_limit))) score += 2;

    if (scheme.details && scheme.details.length < 300) score += 3;

    if (!scheme.income_limit && (!scheme.gender || scheme.gender === "all") &&
      (scheme.state_or_scope === "All" || !scheme.state_or_scope)) score -= 5;

    return score;
  }

  // First scoring pass
  let scored = filtered.map(s => ({
    scheme: s,
    score: scoreScheme(s)
  }));

  // ⭐ Diversity Booster
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

  // Shuffle ties
  function randomizeTie(list) {
    const result = [];
    let i = 0;

    while (i < list.length) {
      const base = list[i].score;
      let group = [list[i]];
      let j = i + 1;

      while (j < list.length && list[j].score === base) {
        group.push(list[j]);
        j++;
      }

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




// ------------------ AI Chat Endpoint ------------------
app.post("/ai-chat", async (req, res) => {
  try {
    const { query, schemeContext, userProfile } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Build prompt
    let prompt = `You are YojanaAI, a helpful government scheme assistant.
User Query: ${query}
`;

    if (schemeContext) {
      prompt += `
Scheme Details:
Name: ${schemeContext.scheme_name || "N/A"}
Eligibility: ${schemeContext.raw_eligibility || "N/A"}
Benefits: ${schemeContext.benefits || "N/A"}
Documents Required: ${schemeContext.documents || "N/A"}
`;
    }

    if (userProfile) {
      prompt += `
User Details:
Age: ${userProfile.age || "N/A"}
Gender: ${userProfile.gender || "N/A"}
State: ${userProfile.state || "N/A"}
Income: ${userProfile.income || "N/A"}
Tags: ${userProfile.tags?.join(", ") || "None"}
`;
    }

    prompt += `\nRespond accurately, concisely, and based only on this context.\n`;

    console.log("🚀 Sending prompt to Gemini...");
    
    // Correct request format for v0.24.x
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    console.log("✔ AI response received");

    // Extract text safely
    let answer =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      null;

    if (!answer) {
      console.error("❌ Could not extract answer:", result);
      return res.status(500).json({ error: "AI response format invalid" });
    }

    return res.json({ answer });

  } catch (err) {
    console.error("🔥 AI Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to get AI response"
    });
  }
});


// ------------------ Start Server ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});