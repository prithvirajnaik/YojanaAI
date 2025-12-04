// utils.js

export const STATES = {
  "andhra_pradesh": ["andhra pradesh", "andhra", "ap"],
  "arunachal_pradesh": ["arunachal pradesh", "arunachal"],
  "assam": ["assam", "as"],
  "bihar": ["bihar", "bh"],
  "chhattisgarh": ["chhattisgarh", "chattisgarh", "ct"],
  "goa": ["goa", "ga"],
  "gujarat": ["gujarat", "gj"],
  "haryana": ["haryana", "hr"],
  "himachal_pradesh": ["himachal pradesh", "himachal", "hp"],
  "jharkhand": ["jharkhand", "jh"],
  "karnataka": ["karnataka", "karntaka", "karnatka", "k'taka", "ka"],
  "kerala": ["kerala", "kl"],
  "madhya_pradesh": ["madhya pradesh", "mp"],
  "maharashtra": ["maharashtra", "mh"],
  "manipur": ["manipur", "mn"],
  "meghalaya": ["meghalaya", "ml"],
  "mizoram": ["mizoram", "mz"],
  "nagaland": ["nagaland", "nl"],
  "odisha": ["odisha", "orissa", "od"],
  "punjab": ["punjab", "pb"],
  "rajasthan": ["rajasthan", "rj"],
  "sikkim": ["sikkim", "sk"],
  "tamil_nadu": ["tamil nadu", "tamilnadu", "tn"],
  "telangana": ["telangana", "tg"],
  "tripura": ["tripura", "tr"],
  "uttar_pradesh": ["uttar pradesh", "up"],
  "uttarakhand": ["uttarakhand", "uttaranchal", "uk"],
  "west_bengal": ["west bengal", "westbengal", "wb"],
  "delhi": ["delhi", "nct", "dl"]
};

const aliasToCanonical = (() => {
  const map = new Map();
  for (const [canon, aliases] of Object.entries(STATES)) {
    for (const a of aliases) {
      map.set(a.trim().toLowerCase(), canon);
    }
    map.set(canon, canon);
  }
  return map;
})();

export function norm(s) {
  return s ? String(s).trim().toLowerCase() : null;
}

export function canonicalizeState(input) {
  if (!input) return null;
  const t = norm(input);
  if (aliasToCanonical.has(t)) return aliasToCanonical.get(t);

  for (const [alias, canon] of aliasToCanonical.entries()) {
    if (t.includes(alias)) return canon;
  }
  return null;
}

function applyUnit(num, unit) {
  if (!unit) return num;
  unit = unit.toLowerCase();
  if (unit === "lakh" || unit === "lac") return num * 100000;
  if (unit === "crore" || unit === "cr") return num * 10000000;
  if (unit === "k") return num * 1000;
  return num;
}

export function parseIncomeFreeText(raw) {
  if (!raw) return null;

  let t = raw.toLowerCase().replace(/₹|,/g, " ");

  if (t.includes("bpl")) return -1;

  const match = t.match(/(\d+(\.\d+)?)\s*(lakh|lac|crore|cr|k)?/);
  if (match) {
    return applyUnit(parseFloat(match[1]), match[3]);
  }

  return null;
}

export const parseUserIncome = s => parseIncomeFreeText(s);
export const parseSchemeIncome = s => {
  if (typeof s === "number") return s;
  return parseIncomeFreeText(s);
};

export function checkState(user, schemeState) {
  if (!schemeState || schemeState === "all") return true;

  const allow = String(schemeState)
    .split(/[,|;]/)
    .map(x => canonicalizeState(x));

  const u = canonicalizeState(user);
  return allow.includes(u);
}

export function checkGender(user, scheme) {
  if (!scheme || scheme === "all") return true;
  if (!user) return true;
  return norm(user) === norm(scheme);
}

export function checkIncome(user, scheme) {
  if (scheme === null) return true;
  if (scheme === -1) return user === -1;
  if (user === null) return true;
  return user <= scheme;
}

export function checkTargets(userTags = [], schemeTags = []) {
  const u = userTags.map(norm);
  const s = schemeTags.map(norm);
  return s.some(tag => u.includes(tag));
}
