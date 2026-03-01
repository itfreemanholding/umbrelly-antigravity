export interface GeneratedBoolean {
    query: string;
    matchesIncluded: number;
    matchesTotal: number;
    rejectionsExcluded: number;
    rejectionsTotal: number;
    matchedIds: string[];
}

export function runPatternEngine(matches: any[], rejections: any[]): GeneratedBoolean[] {
    const matchLen = matches.length;
    const rejLen = rejections.length;

    if (matchLen === 0) {
        return [
            { query: '((AWS | Azure | GCP) & (Migration | Optimization | FinOps))', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] },
            { query: '("Cloud Architect" | "DevOps Engineer")', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] },
            { query: '(kubernetes | docker) (terraform | cloudformation)', matchesIncluded: 0, matchesTotal: 0, rejectionsExcluded: 0, rejectionsTotal: 0, matchedIds: [] }
        ];
    }

    const matchCounts: Record<string, number> = {};
    const rejCounts: Record<string, number> = {};

    // Expanded stop word list to ignore generic job posting fluff
    const stopWords = new Set([
        'this', 'that', 'with', 'from', 'your', 'have', 'will', 'what', 'when', 'where', 'they', 'could', 'would', 'should',
        'about', 'there', 'looking', 'seeking', 'need', 'help', 'work', 'experience', 'required', 'skills', 'project', 'team',
        'expert', 'developer', 'development', 'design', 'designer', 'some', 'more', 'than', 'time', 'years', 'good', 'best',
        'like', 'just', 'know', 'how', 'into', 'only', 'also', 'which', 'their', 'must', 'such', 'other', 'through', 'these',
        'those', 'then', 'make', 'them', 'over', 'very', 'well', 'even', 'most', 'want', 'sure', 'been', 'were', 'does', 'much',
        'can', 'because', 'our', 'any', 'are', 'and', 'the', 'for', 'not'
    ]);

    const tokenize = (text: string) => (text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).filter(w => !stopWords.has(w));

    matches.forEach(m => tokenize(m.title + ' ' + (m.rawText || '')).forEach(w => matchCounts[w] = (matchCounts[w] || 0) + 1));
    rejections.forEach(m => tokenize(m.title + ' ' + (m.rawText || '')).forEach(w => rejCounts[w] = (rejCounts[w] || 0) + 1));

    // Score = (matches / totalMatches) - (rejections / totalRejections)
    const mLenT = Math.max(1, matchLen);
    const rLenT = Math.max(1, rejLen);

    const scores = Object.keys(matchCounts).map(word => {
        const mRate = matchCounts[word] / mLenT;
        const rRate = (rejCounts[word] || 0) / rLenT;
        return { word, score: mRate - (rRate * 1.5) }; // heavily punish rejection presence
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    let keywords = scores.map(s => s.word).slice(0, 10);

    // Fallback if texts didn't have enough words
    const fallbackKws = ["software", "system", "data", "expert", "specialist"];
    while (keywords.length < 5) keywords.push(fallbackKws[keywords.length]);

    // Extract exact phrases from titles
    const phrasesRecord: Record<string, number> = {};
    matches.forEach(m => {
        const words = m.title.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = words[i] + ' ' + words[i + 1];
            phrasesRecord[phrase] = (phrasesRecord[phrase] || 0) + 1;
        }
    });

    let phrases = Object.entries(phrasesRecord).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 3);
    const fallbackPhrases = ["web developer", "front end", "back end"];
    while (phrases.length < 2) phrases.push(fallbackPhrases[phrases.length]);

    // Build the 3 boolean query strings using GigRadar's syntax rules
    const q1 = `(${keywords[0]}* | ${keywords[1]}* | ${keywords[2]}* | ${keywords[3]}*)`;
    const q2 = `(${keywords[0]}* | ${keywords[1]}*) (${keywords[2]} | ${keywords[3]} | ${keywords[4]})`;
    const q3 = `("${phrases[0]}" | "${phrases[1]}")`;

    // Evaluator simulated specifically for our generated templates
    const evaluate = (idx: number, j: any) => {
        const text = (j.title + ' ' + (j.rawText || '')).toLowerCase();
        if (idx === 0) return keywords.slice(0, 4).some(k => text.includes(k));
        if (idx === 1) return keywords.slice(0, 2).some(k => text.includes(k)) && keywords.slice(2, 5).some(k => text.includes(k));
        if (idx === 2) return phrases.slice(0, 2).some(p => text.includes(p));
        return false;
    }

    return [
        {
            query: q1,
            matchesIncluded: matches.filter(m => evaluate(0, m)).length,
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
        }
    ];
}
