// ============================================================
// SEMANTIC MATCHING CODE - ADD TO server.js
// ============================================================
// Add this code BEFORE the "/ai-chat" endpoint (around line 430)

// ------------------ Semantic Matching Helpers ------------------

async function extractUserProfile(text) {
    const prompt = `Extract user profile from this text: "${text}"

Analyze and return ONLY valid JSON (no markdown, no explanation):
{
  "age": number or null,
  "gender": "male" or "female" or null,
  "state": "State Name" or null,
  "income": number (in rupees) or null,
  "occupation": "student" or "farmer" or "entrepreneur" etc or null,
  "education": "10th" or "12th" or "graduate" etc or null,
  "category": "General" or "SC" or "ST" or "OBC" or null,
  "interests": ["keyword1", "keyword2"],
  "needs": ["what user is looking for"]
}

Examples:
Input: "I am a 21 year old female student from Karnataka with income 2 lakh"
Output: {"age":21,"gender":"female","state":"Karnataka","income":200000,"occupation":"student","education":"graduate","category":null,"interests":["education"],"needs":["student schemes"]}

Input: "मैं एक किसान हूं, उम्र 45, राजस्थान से"
Output: {"age":45,"gender":null,"state":"Rajasthan","income":null,"occupation":"farmer","education":null,"category":null,"interests":["agriculture"],"needs":["farming support"]}

Now extract from: "${text}"`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const profile = JSON.parse(jsonText);

        return {
            age: profile.age || null,
            gender: profile.gender?.toLowerCase() || null,
            state: profile.state || null,
            income: profile.income || null,
            occupation: profile.occupation?.toLowerCase() || null,
            education: profile.education || null,
            category: profile.category || null,
            interests: Array.isArray(profile.interests) ? profile.interests : [],
            needs: Array.isArray(profile.needs) ? profile.needs : []
        };
    } catch (err) {
        console.error("Profile extraction failed:", err);
        return simpleParse(text);
    }
}

async function getCandidateSchemes(text, userProfile) {
    let candidates = [];

    const fuseResults = fuse.search(text);
    candidates = fuseResults.slice(0, 100).map(r => r.item);

    if (candidates.length < 50 && userProfile.interests.length > 0) {
        const interestSearch = fuse.search(userProfile.interests.join(' '));
        const additional = interestSearch
            .slice(0, 50)
            .map(r => r.item)
            .filter(s => !candidates.find(c => c.slug === s.slug));

        candidates = [...candidates, ...additional];
    }

    candidates = candidates.filter(scheme => {
        if (userProfile.income && scheme.income_limit) {
            const schemeIncome = parseSchemeIncome(scheme.income_limit);
            if (schemeIncome && userProfile.income > schemeIncome) {
                return false;
            }
        }

        if (userProfile.state && scheme.state_or_scope) {
            if (scheme.state_or_scope !== "All" &&
                !scheme.state_or_scope.toLowerCase().includes(userProfile.state.toLowerCase())) {
                return false;
            }
        }

        if (userProfile.gender && scheme.gender) {
            const schemeGender = scheme.gender.toLowerCase();
            if (schemeGender === "male" && userProfile.gender === "female") return false;
            if (schemeGender === "female" && userProfile.gender === "male") return false;
        }

        return true;
    });

    return candidates.slice(0, 50);
}

async function rankSchemesWithAI(userProfile, candidates) {
    if (candidates.length === 0) return [];

    const schemeSummaries = candidates.map(s => ({
        slug: s.slug,
        name: s.scheme_name,
        target: s.target_groups?.join(', ') || 'General',
        benefits: s.benefits?.substring(0, 200) || '',
        eligibility: s.raw_eligibility?.substring(0, 200) || '',
        category: s.schemeCategory
    }));

    const prompt = `You are an expert at matching government schemes to users.

User Profile:
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- State: ${userProfile.state || 'Not specified'}
- Income: ${userProfile.income ? '₹' + userProfile.income : 'Not specified'}
- Occupation: ${userProfile.occupation || 'Not specified'}
- Education: ${userProfile.education || 'Not specified'}
- Category: ${userProfile.category || 'General'}
- Looking for: ${userProfile.needs.join(', ') || 'General schemes'}

Candidate Schemes (${candidates.length}):
${JSON.stringify(schemeSummaries, null, 2)}

Task: Rank these schemes from most to least relevant for this user.

Scoring Criteria:
1. Eligibility Match (40%): Does user meet all criteria?
2. Benefit Relevance (30%): Do benefits match user needs?
3. Target Group Fit (20%): Is user in target group?
4. Ease of Application (10%): Simple vs complex process

Return ONLY valid JSON array (no markdown):
[
  {
    "slug": "scheme-slug",
    "score": 9.5,
    "reason": "Perfect match because..."
  }
]

Rank ALL ${candidates.length} schemes. Be strict - only 9-10 for perfect matches.`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const rankings = JSON.parse(jsonText);

        const rankedSchemes = rankings
            .map(rank => {
                const scheme = candidates.find(s => s.slug === rank.slug);
                return scheme ? { ...scheme, ai_score: rank.score, ai_reason: rank.reason } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.ai_score - a.ai_score);

        return rankedSchemes;

    } catch (err) {
        console.error("AI ranking failed:", err);
        return candidates;
    }
}

// ------------------ Semantic Matching Endpoint ------------------
app.post("/recommend-semantic", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 10) {
            return res.status(400).json({
                error: "Please provide more details about yourself"
            });
        }

        console.log("🔍 Extracting user profile...");
        const userProfile = await extractUserProfile(text);

        console.log("🔎 Finding candidate schemes...");
        const candidates = await getCandidateSchemes(text, userProfile);

        console.log("🎯 Ranking schemes semantically...");
        const ranked = await rankSchemesWithAI(userProfile, candidates);

        return res.json({
            semantic: true,
            count: ranked.length,
            items: ranked.slice(0, 8),
            user: userProfile
        });

    } catch (err) {
        console.error("❌ Semantic matching error:", err);

        return res.status(500).json({
            error: "AI matching failed, try regular search",
            fallback_endpoint: "/recommend"
        });
    }
});
