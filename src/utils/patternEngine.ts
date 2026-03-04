export interface GeneratedBoolean {
    query: string;
    matchesIncluded: number;
    matchesTotal: number;
    rejectionsExcluded: number;
    rejectionsTotal: number;
    matchedIds: string[];
}

export function runPatternEngine(matches: any[], rejections: any[], seed: number = 0): GeneratedBoolean[] {
    const matchLen = matches.length;
    const rejLen = rejections.length;

    // Extract the original base boolean to combine with generated logic
    const baseBooleanRaw = matches.find((m: any) => m.booleanSearch)?.booleanSearch || '';
    const baseBoolean = baseBooleanRaw ? baseBooleanRaw + ' ' : '';

    if (matchLen === 0) {
        return [
            { query: baseBoolean + '((AWS | Azure | GCP) & (Migration | Optimization | FinOps))', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] },
            { query: baseBoolean + '("Cloud Architect" | "DevOps Engineer")', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] },
            { query: baseBoolean + '(kubernetes | docker) (terraform | cloudformation)', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] },
            { query: '(cost | billing | spend) (reduce | decrease | audit)', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] },
            { query: '("finops" | "cloud financial") (aws | azure | gcp)', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] }
        ];
    }

    // Expanded stop word list to ignore generic job posting fluff
    const stopWords = new Set([
        'this', 'that', 'with', 'from', 'your', 'have', 'will', 'what', 'when', 'where', 'they', 'could', 'would', 'should',
        'about', 'there', 'looking', 'seeking', 'need', 'help', 'work', 'experience', 'required', 'skills', 'project', 'team',
        'expert', 'developer', 'development', 'design', 'designer', 'some', 'more', 'than', 'time', 'years', 'good', 'best',
        'like', 'just', 'know', 'how', 'into', 'only', 'also', 'which', 'their', 'must', 'such', 'other', 'through', 'these',
        'those', 'then', 'make', 'them', 'over', 'very', 'well', 'even', 'most', 'want', 'sure', 'been', 'were', 'does', 'much',
        'can', 'because', 'our', 'any', 'are', 'and', 'the', 'for', 'not',
        'days', 'hours', 'months', 'weeks', 'today', 'yesterday', 'posted', 'month', 'hour', 'week', 'ago'
    ]);

    const tokenize = (text: string) => (text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(w => !stopWords.has(w));
    const tokenizedMatches = matches.map(m => ({ id: m.id, tokens: tokenize(m.title + ' ' + (m.rawText || '')), original: m }));
    const tokenizedRejs = rejections.map(m => ({ id: m.id, tokens: tokenize(m.title + ' ' + (m.rawText || '')), original: m }));

    // Strategy 1: GREEDY 100% PRECISION ALGORITHM
    // 1. Find all words/phrases that appear in matches but NEVER in rejections (Safe Terms)
    const safeTerms = new Map<string, Set<string>>(); // term -> set of match IDs it covers

    // Get all unique words across matches
    const allMatchWords = new Set<string>();
    tokenizedMatches.forEach(m => m.tokens.forEach(w => allMatchWords.add(w)));

    // Extract Safe Words
    allMatchWords.forEach(word => {
        const isInRej = tokenizedRejs.some(r => r.tokens.includes(word));
        if (!isInRej) {
            const coveringIds = new Set(tokenizedMatches.filter(m => m.tokens.includes(word)).map(m => m.id));
            if (coveringIds.size > 0) {
                safeTerms.set(word, coveringIds);
            }
        }
    });

    // Extract exact phrases from titles (Skipping stop words to prevent "days ago")
    const phrasesRecord: Record<string, number> = {};
    matches.forEach(m => {
        const words = m.title.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        for (let i = 0; i < words.length - 1; i++) {
            if (stopWords.has(words[i]) || stopWords.has(words[i + 1])) continue;
            const phrase = words[i] + ' ' + words[i + 1];
            phrasesRecord[phrase] = (phrasesRecord[phrase] || 0) + 1;
        }
    });

    // Strategy 3 processing (Standard Top Phrases)
    const phrases = Object.entries(phrasesRecord).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 3);
    const fallbackPhrases = ["web developer", "front end", "back end"];
    while (phrases.length < 2) phrases.push(fallbackPhrases[phrases.length]);

    // Add Safe Phrases to safeTerms for Greedy Algorithm
    Object.keys(phrasesRecord).forEach(phrase => {
        const isInRej = rejections.some(r => {
            const text = (r.title + ' ' + (r.rawText || '')).toLowerCase();
            return text.includes(phrase);
        });
        if (!isInRej) {
            const coveringIds = new Set(matches.filter(m => {
                const text = (m.title + ' ' + (m.rawText || '')).toLowerCase();
                return text.includes(phrase);
            }).map(m => m.id));
            if (coveringIds.size > 0) {
                // Ensure phrases are quoted for the boolean generator
                safeTerms.set(`"${phrase}"`, coveringIds);
            }
        }
    });

    // 2. Iteratively pick the safe term that covers the MOST UNCOVERED matches
    const uncoveredIds = new Set(matches.map(m => m.id));
    const selectedGreedyTerms: string[] = [];

    // Pseudo-random function for tie-breaking based on seed
    const pseudoRandom = (i: number) => Math.sin(seed + i) * 10000 - Math.floor(Math.sin(seed + i) * 10000);

    let iteration = 0;
    while (uncoveredIds.size > 0 && safeTerms.size > 0) {
        let bestTerm = '';
        let maxNewCoverage = 0;
        let bestCoverageSet = new Set<string>();

        for (const [term, coverSet] of safeTerms.entries()) {
            let newCoverage = 0;
            coverSet.forEach(id => { if (uncoveredIds.has(id)) newCoverage++; });

            if (newCoverage > maxNewCoverage) {
                maxNewCoverage = newCoverage;
                bestTerm = term;
                bestCoverageSet = coverSet;
            } else if (newCoverage === maxNewCoverage && maxNewCoverage > 0) {
                // Use seed for randomized tie-breaking on regeneration
                if (pseudoRandom(iteration) > 0.5) {
                    bestTerm = term;
                    bestCoverageSet = coverSet;
                }
            }
            iteration++;
        }

        if (maxNewCoverage === 0) break; // Cannot cover the remaining matches with purely safe terms

        selectedGreedyTerms.push(bestTerm);
        bestCoverageSet.forEach(id => uncoveredIds.delete(id));
        safeTerms.delete(bestTerm); // Don't pick it again
    }

    // Build Greedy Query
    const q1 = baseBoolean + (selectedGreedyTerms.length > 0
        ? `(${selectedGreedyTerms.join(' | ')})`
        : '(cloud | data | system)'); // Ultimate fallback

    // Calculate precision
    const coveredGreedyMatches = matches.filter(m => {
        const text = (m.title + ' ' + (m.rawText || '')).toLowerCase();
        return selectedGreedyTerms.some(term => {
            if (term.startsWith('"') && term.endsWith('"')) {
                return text.includes(term.slice(1, -1)); // Phrase
            }
            return new RegExp(`\\b${term}\\b`, 'i').test(text); // Word Boundary Match for single words
        });
    });

    // --- Strategy 2: Traditional Scored Keywords ---
    const matchCounts: Record<string, number> = {};
    const rejCounts: Record<string, number> = {};
    tokenizedMatches.forEach(m => m.tokens.forEach(w => matchCounts[w] = (matchCounts[w] || 0) + 1));
    tokenizedRejs.forEach(m => m.tokens.forEach(w => rejCounts[w] = (rejCounts[w] || 0) + 1));

    const mLenT = Math.max(1, matchLen);
    const rLenT = Math.max(1, rejLen);

    const scores = Object.keys(matchCounts).map(word => {
        const mRate = matchCounts[word] / mLenT;
        const rRate = (rejCounts[word] || 0) / rLenT;
        // Introduce slight randomness to scoring for regeneration differences
        const randomFuzz = (pseudoRandom(word.length) - 0.5) * 0.1;
        return { word, score: mRate - (rRate * 1.5) + randomFuzz };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    const keywords = scores.map(s => s.word).slice(0, 10);
    const fallbackKws = ["software", "system", "data", "expert", "specialist", "engineer", "cloud", "aws", "infrastructure", "devops"];
    while (keywords.length < 10) keywords.push(fallbackKws[keywords.length]);

    const q2 = baseBoolean + `(${keywords[0]}* | ${keywords[1]}*) (${keywords[2]} | ${keywords[3]} | ${keywords[4]})`;
    const q3 = baseBoolean + `("${phrases[0] || 'cloud'}" | "${phrases[1] || 'engineer'}")`;
    const q4 = `(${keywords[5]}* | ${keywords[6]}*) (${keywords[7]} | ${keywords[8]} | ${keywords[9]})`;
    const q5 = `("${phrases[2] || 'aws'}" | "${phrases[3] || 'gcp'}") (migration | optimization | specialist)`;

    // Evaluator specifically for generated templates
    const evaluate = (idx: number, j: any) => {
        const text = (j.title + ' ' + (j.rawText || '')).toLowerCase();

        if (idx === 0) {
            // Evaluator 1 for the Greedy Strategy
            return selectedGreedyTerms.some(term => {
                if (term.startsWith('"') && term.endsWith('"')) return text.includes(term.slice(1, -1));
                return new RegExp(`\\b${term}\\b`, 'i').test(text); // Word boundary check
            });
        }

        if (idx === 1) return keywords.slice(0, 2).some(k => text.includes(k)) && keywords.slice(2, 5).some(k => text.includes(k));
        if (idx === 2) return (phrases[0] && text.includes(phrases[0])) || (phrases[1] && text.includes(phrases[1]));
        if (idx === 3) return keywords.slice(5, 7).some(k => text.includes(k)) && keywords.slice(7, 10).some(k => text.includes(k));
        if (idx === 4) return ((phrases[2] && text.includes(phrases[2])) || (phrases[3] && text.includes(phrases[3])) || text.includes('aws') || text.includes('gcp')) && (text.includes('migration') || text.includes('optimization') || text.includes('specialist'));

        return false;
    }

    return [
        {
            query: q1,
            matchesIncluded: coveredGreedyMatches.length,
            matchesTotal: matchLen,
            rejectionsExcluded: rejections.filter(m => !evaluate(0, m)).length,
            rejectionsTotal: rejLen,
            matchedIds: [...matches, ...rejections].filter(m => evaluate(0, m)).map(m => m.id)
        },
        {
            query: q2,
            matchesIncluded: matches.filter(m => evaluate(1, m)).length,
            matchesTotal: matchLen,
            rejectionsExcluded: rejections.filter(m => !evaluate(1, m)).length,
            rejectionsTotal: rejLen,
            matchedIds: [...matches, ...rejections].filter(m => evaluate(1, m)).map(m => m.id)
        },
        {
            query: q3,
            matchesIncluded: matches.filter(m => evaluate(2, m)).length,
            matchesTotal: matchLen,
            rejectionsExcluded: rejections.filter(m => !evaluate(2, m)).length,
            rejectionsTotal: rejLen,
            matchedIds: [...matches, ...rejections].filter(m => evaluate(2, m)).map(m => m.id)
        },
        {
            query: q4,
            matchesIncluded: matches.filter(m => evaluate(3, m)).length,
            matchesTotal: matchLen,
            rejectionsExcluded: rejections.filter(m => !evaluate(3, m)).length,
            rejectionsTotal: rejLen,
            matchedIds: [...matches, ...rejections].filter(m => evaluate(3, m)).map(m => m.id)
        },
        {
            query: q5,
            matchesIncluded: matches.filter(m => evaluate(4, m)).length,
            matchesTotal: matchLen,
            rejectionsExcluded: rejections.filter(m => !evaluate(4, m)).length,
            rejectionsTotal: rejLen,
            matchedIds: [...matches, ...rejections].filter(m => evaluate(4, m)).map(m => m.id)
        }
    ];
}
