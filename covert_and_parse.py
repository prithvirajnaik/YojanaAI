import pandas as pd
import re
import json
from pathlib import Path

INPUT_CSV = "data/updated_data.csv"
OUT_RAW = "output/schemes.json"
OUT_PARSED = "output/schemes_parsed.json"

# ---------------------------
# Helper Extract Functions
# ---------------------------

def extract_income(text):
    if pd.isna(text): 
        return None
    text = str(text).lower().strip()

    # --- Ignore dates like 01.01.2022 or 1.1.2024 ---
    if re.match(r'^\d{1,2}\.\d{1,2}\.\d{2,4}$', text):
        return None

    # --- Find patterns like: ---
    # 3 lakh, 2.5 lakh, 300000, Rs 2,00,000, ₹50000
    m = re.search(r'(\d[\d,\.]*)(\s*lakh|\s*lac)?', text)
    if m:
        num = m.group(1).replace(",", "")

        # Reject values that look like dates (1.01, 01.01 etc.)
        if "." in num and not num.replace(".", "").isdigit():
            return None

        try:
            val = float(num)
        except ValueError:
            return None

        # Convert lakh → number
        if m.group(2) and ("lakh" in m.group(2) or "lac" in m.group(2)):
            return int(val * 100000)
        else:
            # Only treat as income if value is reasonably large
            if val < 1000:   # avoids picking up small numbers like 01
                return None
            return int(val)

    # BPL markers
    if "bpl" in text or "below poverty" in text:
        return -1

    return None


def extract_age(text):
    if pd.isna(text): return None
    text = str(text).lower()

    # Examples: age 18-60, 18 to 40, 21 years
    m = re.search(r'(\d{1,3})\s*[-to]+\s*(\d{1,3})', text)
    if m:
        return f"{m.group(1)}-{m.group(2)}"

    m2 = re.search(r'(\d{1,3})\s*years?', text)
    if m2:
        return m2.group(1)

    return None


def extract_gender(text):
    if pd.isna(text): return None
    t = text.lower()
    if "women" in t or "female" in t or "girl" in t:
        return "female"
    if "male" in t or "man" in t or "boy" in t:
        return "male"
    return None


def extract_state_or_scope(text):
    if pd.isna(text): return "All"
    t = text.lower()

    states = [
        "karnataka", "maharashtra", "uttar pradesh", "bihar", "tamil nadu",
        "andhra pradesh", "kerala", "gujarat", "rajasthan", "west bengal",
        "delhi", "madhya pradesh", "punjab", "haryana", "odisha"
    ]

    for s in states:
        if s in t:
            return s.title()

    if "all india" in t or "nation" in t:
        return "All"

    return "All"


def extract_target_groups(text):
    if pd.isna(text): return []
    t = text.lower()
    targets = []

    keywords = {
        "farmer": ["farmer", "agricultur"],
        "student": ["student", "scholar"],
        "senior": ["senior", "old age", "elder"],
        "women": ["women", "female", "girl"],
        "disabled": ["disabled", "divyang", "differently abled", "pwd"],
        "worker": ["labour", "worker"],
        "bpl": ["bpl", "below poverty"]
    }

    for tag, keys in keywords.items():
        for k in keys:
            if k in t:
                targets.append(tag)
                break

    return targets


# ---------------------------
# Load CSV
# ---------------------------

df = pd.read_csv(INPUT_CSV, encoding='utf-8', sep=None, engine="python")

# Clean column names
df.columns = [c.strip() for c in df.columns]

raw_records = []
parsed_records = []


# ---------------------------
# Parse Rows
# ---------------------------

for _, row in df.iterrows():
    raw = {col: (str(row[col]).strip() if not pd.isna(row[col]) else "") for col in df.columns}
    raw_records.append(raw)

    elig_text = raw.get("eligibility", "")

    parsed = {
        "scheme_name": raw.get("scheme_name"),
        "slug": raw.get("slug"),
        "details": raw.get("details"),
        "benefits": raw.get("benefits"),
        "documents": raw.get("documents"),
        "application": raw.get("application"),
        "level": raw.get("level"),
        "schemeCategory": raw.get("schemeCategory"),
        "tags": raw.get("tags"),

        # Parsed values
        "income_limit": extract_income(elig_text),
        "age_limit": extract_age(elig_text),
        "gender": extract_gender(elig_text),
        "state_or_scope": extract_state_or_scope(elig_text),
        "target_groups": extract_target_groups(elig_text),
        "raw_eligibility": elig_text
    }

    parsed_records.append(parsed)


# ---------------------------
# Save Outputs
# ---------------------------

Path("output").mkdir(exist_ok=True)

Path(OUT_RAW).write_text(json.dumps(raw_records, indent=2, ensure_ascii=False), encoding="utf-8")
Path(OUT_PARSED).write_text(json.dumps(parsed_records, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"Saved {OUT_RAW} and {OUT_PARSED}")
