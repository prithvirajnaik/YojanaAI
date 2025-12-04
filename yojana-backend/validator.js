// validator.js
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

const schemeSchema = {
  type: "object",
  required: ["scheme_name", "slug"],
  properties: {
    scheme_name: { type: "string" },
    slug: { type: "string" },
    details: { type: "string" },
    benefits: { type: "string" },
    raw_eligibility: { type: "string" },
    schemeCategory: { type: "string" },
    state_or_scope: {
      anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
    },
    income_limit: { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] },
    gender: { type: "string" },
    target_groups: { type: "array", items: { type: "string" } }
  }
};

const validate = ajv.compile(schemeSchema);

export function validateSchemes(list) {
  const good = [];
  const bad = [];

  for (const s of list) {
    const ok = validate(s);
    if (ok) good.push(s);
    else bad.push({ s, errors: validate.errors });
  }

  return { good, bad };
}
