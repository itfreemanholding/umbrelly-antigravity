function stripTimestamps(text) {
    if (!text) return text;
    let cleaned = text;
    // Remove lines that are just dates like "a month ago", "21 days ago", "just now", "yesterday", "today"
    // Using multiline flag so ^ matches start of a line
    cleaned = cleaned.replace(/^[ \t]*(?:Posted\s*)?(?:about\s+|over\s+|almost\s+)?(?:a|an|\d+)\s+(?:second|minute|hour|day|week|month|year)s?\s+ago[ \t]*\n/gmi, '');
    cleaned = cleaned.replace(/^[ \t]*(?:just now|today|yesterday)[ \t]*\n/gmi, '');
    return cleaned;
}

function stripUiTags(text) {
    if (!text) return text;
    let cleaned = text;
    cleaned = cleaned.replace(/(?:^|\n)(?:More\.\.\.|Less)\s*$/i, '');
    cleaned = cleaned.replace(/(?:^|\n)(?:More\.\.\.|Less)\s*$/i, '');
    return cleaned.trim();
}

function cleanJobTextTest(rawText) {
    if (!rawText) return '';
    let cleaned = rawText;

    // First strip timestamps
    cleaned = stripTimestamps(cleaned);

    const gigRadarIndex = cleaned.search(/GigRadar Score/i);

    if (gigRadarIndex !== -1) {
        const cutoff = cleaned.substring(0, gigRadarIndex).lastIndexOf('More...');
        if (cutoff !== -1 && (gigRadarIndex - cutoff) < 50) {
            return stripUiTags(cleaned.substring(0, cutoff).trim());
        }
        const fallbackCutoff = cleaned.lastIndexOf('\n', gigRadarIndex - 5);
        if (fallbackCutoff !== -1) {
            return stripUiTags(cleaned.substring(0, fallbackCutoff).trim());
        }
        return stripUiTags(cleaned.substring(0, gigRadarIndex).trim());
    }

    const altCutoff = cleaned.search(/(Talent Preference|Total Spent|Company Size|Client Feedback|Extracting\.\.\.)/i);
    if (altCutoff !== -1) {
        const fallbackCutoff2 = cleaned.lastIndexOf('\n', altCutoff);
        if (fallbackCutoff2 !== -1) return stripUiTags(cleaned.substring(0, fallbackCutoff2).trim());
        return stripUiTags(cleaned.substring(0, altCutoff).trim());
    }
    return stripUiTags(cleaned.trim());
}

const sampleData1 = `Next.js Deployment & Cloud Cost Optimization Expert
a month ago
I have built an e-commerce application using Next.js 14 ...
More...`;

const sampleData2 = `AWS cost optimisation audit and implementation for saad platform
21 days ago
We are seeking an experienced AWS expert...`;

console.log("--- CLEANED DATA 1 ---");
console.log(cleanJobTextTest(sampleData1));

console.log("\n--- CLEANED DATA 2 ---");
console.log(cleanJobTextTest(sampleData2));
