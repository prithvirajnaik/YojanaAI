// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // allow frontend to call this (dev/hackathon). Tighten in prod.

const DATA_PATH = path.join(__dirname, 'output', 'schemes_parsed.json');

// --------- Load data ----------
let schemes = [];
try {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  schemes = JSON.parse(raw);
  console.log(`Loaded ${schemes.length} schemes from ${DATA_PATH}`);
} catch (err) {
  console.error('Failed to load schemes_parsed.json. Make sure the file exists at output/schemes_parsed.json');
  console.error(err);
  process.exit(1);
}

// --------- Utility helpers ----------

// safe parse of income strings saved by parser (could be number or -1 for BPL or null)
function parseSchemeIncome(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value; // already numeric
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'bpl') return -1;
    // try to extract digits
    const digits = s.replace(/[,₹\s]/g, '').match(/\d+/);
    if (digits) return parseInt(digits[0], 10);
  }
  return null;
}

// parse user income input (string or number). BPL -> -1
function parseUserIncome(inp) {
  if (inp === undefined || inp === null) return null;
  if (typeof inp === 'number') return inp;
  const s = String(inp).trim().toLowerCase();
  if (s.includes('bpl') || s.includes('below poverty')) return -1;
  // "3 lakh" -> 300000
  const m = s.match(/(\d+(\.\d+)?)\s*(lakh|lac)/);
  if (m) {
    return Math.round(parseFloat(m[1]) * 100000);
  }
  // digits like 300000 or 2,00,000
  const digits = s.replace(/[,₹\s]/g, '').match(/\d+/);
  if (digits) {
    const val = parseInt(digits[0], 10);
    // treat small numbers < 1000 as likely not an annual income
    if (val < 1000) return null;
    return val;
  }
  return null;
}

function checkIncome(userIncome, schemeIncome) {
  // userIncome: number | -1 (BPL) | null
  // schemeIncome: numeric | -1 (BPL) | null
  if (schemeIncome === null || schemeIncome === undefined) return true; // no restriction
  if (schemeIncome === -1) {
    return userIncome === -1;
  }
  if (userIncome === null || userIncome === undefined) return true; // be permissive if unknown
  return userIncome <= schemeIncome;
}

function checkState(userState, schemeState) {
  if (!schemeState || schemeState.toLowerCase() === 'all') return true;
  if (!userState) return true;
  return String(schemeState).toLowerCase().includes(String(userState).toLowerCase());
}

function checkGender(userGender, schemeGender) {
  if (!schemeGender) return true;
  if (!userGender) return true;
  const sG = String(schemeGender).toLowerCase();
  const uG = String(userGender).toLowerCase();
  if (sG === 'any' || sG === 'all') return true;
  return sG.includes(uG);
}

function checkTargets(userTags, schemeTargets) {
  if (!schemeTargets || schemeTargets.length === 0) return true;
  if (!userTags || userTags.length === 0) return false;
  // both arrays of lowercase strings
  const u = userTags.map(x => String(x).toLowerCase());
  const s = schemeTargets.map(x => String(x).toLowerCase());
  return s.some(t => u.includes(t));
}

// Very small parser to extract age, gender, income, state, tags from a short user text.
// This is a fallback extractor for offline/hackathon use.
function simpleParse(text) {
  if (!text || typeof text !== 'string') return {};
  const t = text.toLowerCase();

  // age
  const ageMatch = t.match(/(\d{1,3})\s*(?:years|year|yrs|yr)?/);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

  // gender
  let gender = null;
  if (t.match(/\b(woman|women|female|girl)\b/)) gender = 'female';
  else if (t.match(/\b(man|men|male|boy)\b/)) gender = 'male';

  // income
  const income = parseUserIncome(t);

  // state (naive list)
  const states = ['karnataka','maharashtra','uttar pradesh','bihar','tamil nadu','kerala','gujarat','rajasthan','west bengal','delhi','madhya pradesh','punjab','haryana','odisha','andhra pradesh'];
  let state = null;
  for (const s of states) if (t.includes(s)) { state = s; break; }

  // tags (student, farmer, senior, disabled, bpl, worker)
  const tags = [];
  if (t.includes('student') || t.includes('scholar')) tags.push('student');
  if (t.includes('farmer') || t.includes('agricultur')) tags.push('farmer');
  if (t.includes('senior') || t.includes('old age') || t.includes('elder')) tags.push('senior');
  if (t.includes('divyang') || t.includes('disabled') || t.includes('pwd')) tags.push('disabled');
  if (t.includes('bpl') || t.includes('below poverty')) tags.push('bpl');
  if (t.includes('woman') || t.includes('female')) tags.push('women');

  return { age, gender, income, state, tags };
}

// Prepare Fuse.js (fuzzy search) to search key textual fields
const fuseOptions = {
  includeScore: true,
  keys: [
    'scheme_name',
    'details',
    'benefits',
    'raw_eligibility',
    'tags',
    'schemeCategory'
  ],
  threshold: 0.4 // 0.0 exact -> 1.0 broad. 0.4 is reasonable for hackathon
};
const fuse = new Fuse(schemes, fuseOptions);

// --------- Endpoints ----------

// health
app.get('/', (req, res) => {
  res.json({ status: 'ok', schemes_count: schemes.length });
});

// parse: extracts structured fields from user text (uses local fallback parser)
app.post('/parse', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text field required' });

  // prefer LLM extractor if you later add it; currently we use simpleParse
  const parsed = simpleParse(text);
  return res.json({ parsed });
});

// recommend: given user object, return ranked scheme matches
app.post('/recommend', (req, res) => {
  // Accept either { text: "..."} OR structured { age, gender, income, state, tags }
  const body = req.body || {};
  let user = {};
  if (body.text) {
    user = simpleParse(body.text);
  } else {
    // copy fields conservatively
    user.age = body.age || null;
    user.gender = body.gender || null;          
    user.income = body.income !== undefined ? parseUserIncome(body.income) : null;
    user.state = body.state || null;
    user.tags = Array.isArray(body.tags) ? body.tags : [];
  } 

  // Normalize user.income
  if (user.income === undefined) user.income = null;

  // 1) Fuse.js fuzzy search by user's text if provided (gives candidate set)
  let candidates = schemes;
  if (body.text && body.text.trim().length > 2) {
    const fuseRes = fuse.search(body.text);
    // take top 200 matches to keep it fast
    candidates = fuseRes.slice(0, 200).map(r => r.item);
  }

  // 2) Filter candidates via rule-based checks
  const filtered = candidates.filter(s => {
    try {
      const schemeIncome = parseSchemeIncome(s.income_limit);
      if (!checkIncome(user.income, schemeIncome)) return false;
      if (!checkState(user.state, s.state_or_scope)) return false;
      if (!checkGender(user.gender, s.gender)) return false;
      if (!checkTargets(user.tags, s.target_groups)) return false;
      return true;
    } catch (e) {
      return false;
    }
  });

  // 3) Rank: simple scoring heuristic
  const scored = filtered.map(s => {
    let score = 0;
    // + points for matching tags
    if (s.target_groups && s.target_groups.length > 0 && user.tags && user.tags.length > 0) {
      const common = s.target_groups.filter(t => user.tags.map(x=>x.toLowerCase()).includes(String(t).toLowerCase())).length;
      score += common * 5;
    }
    // + points for textual fuzzy match
    if (body.text && body.text.trim().length > 2) {
      const f = fuse.search(body.text, { limit: 1, keys: ['scheme_name'] });
      if (f && f.length > 0 && f[0].item && f[0].item.slug === s.slug) score += 3;
    }
    // shorter details -> prefer concise schemes (arbitrary)
    if (s.details && s.details.length < 300) score += 1;
    return { scheme: s, score };
  });

  scored.sort((a,b) => b.score - a.score);

  // Return top N results with count
  const top = scored.slice(0, 8).map(r => r.scheme);
  res.json({ count: scored.length, items: top, user });
});

// get single scheme by slug or scheme_name
app.get('/scheme/:slug', (req, res) => {
  const slug = req.params.slug;
  const s = schemes.find(x => (x.slug && x.slug.toLowerCase() === slug.toLowerCase()) || (x.scheme_name && x.scheme_name.toLowerCase() === slug.toLowerCase()));
  if (!s) return res.status(404).json({ error: 'Scheme not found' });
  res.json(s);
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YojanaAI backend listening on port ${PORT}`);
});
