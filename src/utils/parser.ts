export interface ParsedJob {
    id: string;
    title: string;
    scannerName: string;
    description: string;
    budget: string;
    duration: string;
    totalSpent: string;
    clientCountry: string;
    skills: string[];
    gigRadarScore: string;
    talentPreference: string;
    experienceLevel: string;
    hourlyLoad: string;
    avgRatePaid: string;
    companySize: string;
    paymentType: string;
    paymentVerified: boolean;
    clientFeedback: string;
    memberSince: string;
    matchScore: number;
    memo: string;
    booleanSearch: string;
    dateIngested: string;
    postedTimeAgo: string;
    cloudTag: string;
    rawText: string;
}

export function cleanJobTitle(title: string): string {
    if (!title) return '';
    let cleaned = title.replace(/(?:\s*[-,|]?\s*)(?:Posted\s*)?(?:about\s+|over\s+|almost\s+)?(?:a|an|\d+)\s+(?:second|minute|hour|day|month|year)s?\s+ago[\s\S]*$/i, '').trim();
    cleaned = cleaned.replace(/(?:\s*[-,|]?\s*)(?:just now|today|yesterday)[\s\S]*$/i, '').trim();
    return cleaned;
}

export function parseGigRadarText(text: string): Partial<ParsedJob> {
    if (!text) return {};

    const rawLines = text.split('\n');
    const lines = rawLines.map(l => l.trim()).filter(line => line.length > 0);

    if (lines.length < 3) {
        // If it's too short, just treat the whole thing as a description
        return { title: 'Unknown Title', scannerName: 'Unknown Scanner', description: text };
    }

    // Clean up title (remove trailing timestamps like '21 days ago' regardless of invisible characters)
    const title = cleanJobTitle(lines[0]);

    // Build description from rawLines to preserve formatting
    const descriptionRawLines: string[] = [];
    const skills: string[] = [];
    let budget = '-';
    let duration = '-';
    let totalSpent = '-';
    let clientCountry = '-';
    let gigRadarScore = '-';
    let talentPreference = '-';
    let experienceLevel = '-';
    let hourlyLoad = '-';
    let avgRatePaid = '-';
    let companySize = '-';
    let paymentType = '-';
    let paymentVerified = false;
    let clientFeedback = '-';
    let memberSince = '-';
    let postedTimeAgo = 'Just now';
    let cloudTag = 'Other';

    let parsingDescription = true;

    // First pass layout analysis using rawLines to preserve spacing
    for (let i = 1; i < rawLines.length; i++) {
        const rawLine = rawLines[i];
        const line = rawLine.trim();

        if (line === '') {
            if (parsingDescription) descriptionRawLines.push(rawLine);
            continue;
        }

        // Identify transition from Description to Skills/Metrics
        const isMetricStart = line.match(/^[📡⭐️]/) ||
            line === 'GigRadar Score' ||
            line === 'Fixed-Price' ||
            line === 'Hourly' ||
            line === 'Talent Preference';

        if (parsingDescription && isMetricStart) {
            parsingDescription = false;

            // Backtrack to find skills (they are usually between the end of the desc and the metrics)
            let j = descriptionRawLines.length - 1;
            // Short strings without terminating punctuation are usually skill tags
            while (j >= 0 && descriptionRawLines[j].length < 60 && !descriptionRawLines[j].endsWith('.') && !descriptionRawLines[j].endsWith('!') && !descriptionRawLines[j].endsWith(':')) {
                // Also ignore if it is exactly "More..."
                if (descriptionRawLines[j] !== 'More...') {
                    skills.unshift(descriptionRawLines[j]);
                }
                descriptionRawLines.pop();
                j--;
            }
        }

        const isDateLine = i < 5 && (line.includes('days ago') || line.includes('hours ago') || line.includes('minutes ago') || line.includes('months ago'));
        if (isDateLine) {
            postedTimeAgo = line;
        }

        if (parsingDescription && line !== 'More...' && !isDateLine && !isMetricStart) {
            descriptionRawLines.push(rawLine);
        }
    }

    // Secondary specialized extraction pass
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line === 'GigRadar Score') gigRadarScore = i > 0 ? lines[i - 1].replace(/📡\s*/, '').trim() : '-';
        if (line === 'Fixed-Price' || line === 'Budget') {
            budget = i > 0 ? lines[i - 1] : '-';
            paymentType = 'Fixed Price';
        }
        if (line === 'Hourly' || line === 'Hourly Rate') {
            budget = i > 0 ? lines[i - 1] : '-';
            paymentType = 'Hourly';
        }
        if (line === 'Talent Preference') talentPreference = i > 0 ? lines[i - 1] : '-';
        if (line === 'Experience Level') experienceLevel = i > 0 ? lines[i - 1] : '-';
        if (line === 'Hourly Load') hourlyLoad = i > 0 ? lines[i - 1] : '-';
        if (line === 'Duration') duration = i > 0 ? lines[i - 1] : '-';
        if (line === 'Country') clientCountry = i > 0 ? lines[i - 1].trim() : '-';
        if (line === 'Total Spent') totalSpent = i > 0 ? lines[i - 1] : '-';
        if (line === 'Avg Rate Paid') avgRatePaid = i > 0 ? lines[i - 1] : '-';
        if (line === 'Company Size') companySize = i > 0 ? lines[i - 1] : '-';
        if (line === 'Payment Verified') paymentVerified = i > 0 && lines[i - 1] === 'Verified';
        if (line === 'Member Since') memberSince = i > 0 ? lines[i - 1] : '-';
        if (line === 'Client Feedback') clientFeedback = i > 0 ? lines[i - 1].replace(/⭐️\s*/, '').trim() : '-';
    }

    // clean up empty lines at the start of description
    while (descriptionRawLines.length > 0 && descriptionRawLines[0].trim() === '') {
        descriptionRawLines.shift();
    }

    // clean up stray timestamps at the start of the description like "a month ago" or "2 days ago"
    if (descriptionRawLines.length > 0) {
        const firstLine = descriptionRawLines[0].trim().toLowerCase();
        if (firstLine.match(/^(?:posted\s*)?(?:about\s+|over\s+|almost\s+)?(a|an|\d+)\s+(minute|hour|day|month|year)s?\s+ago$/)) {
            descriptionRawLines.shift();

            // shift again if there's an empty line following the timestamp
            while (descriptionRawLines.length > 0 && descriptionRawLines[0].trim() === '') {
                descriptionRawLines.shift();
            }
        }
    }

    const description = descriptionRawLines.join('\n');

    // Determine Cloud Tag based on title and description content
    const fullTextUpper = (title + ' ' + description).toUpperCase();
    if (fullTextUpper.includes('AWS') || fullTextUpper.includes('AMAZON WEB SERVICES')) {
        cloudTag = 'AWS';
    } else if (fullTextUpper.includes('GCP') || fullTextUpper.includes('GOOGLE CLOUD')) {
        cloudTag = 'GCP';
    } else if (fullTextUpper.includes('AZURE')) {
        cloudTag = 'Azure';
    }

    return {
        title,
        scannerName: 'Unknown Scanner', // Will be overridden if provided by extension
        description: description || 'No description extracted',
        skills,
        gigRadarScore,
        talentPreference,
        experienceLevel,
        hourlyLoad,
        avgRatePaid,
        companySize,
        paymentType,
        paymentVerified,
        clientFeedback,
        memberSince,
        budget,
        duration,
        totalSpent,
        clientCountry,
        postedTimeAgo,
        cloudTag,
        rawText: text
    };
}

export function cleanJobText(rawText: string): string {
    if (!rawText) return '';

    let cleanedText = stripTimestamps(rawText);

    // The GigRadar footer usually starts with the score or "More...".
    // We can look for keywords like "GigRadar Score", "Talent Preference", "Total Spent"
    // A robust way is finding the common delimiter or the first occurrence of these specific metadata blocks.

    // Pattern to catch the start of the typical footer block (e.g. "📡 38%\nGigRadar Score")
    // or just the "GigRadar Score" text itself which is highly specific.
    const gigRadarIndex = cleanedText.search(/GigRadar Score/i);

    // Also look for "Extracting..." or "Less than \d+ month" blocks.
    if (gigRadarIndex !== -1) {
        // Find a safe cutoff point before the score, e.g. looking backwards for a newline or "More..."
        const cutoff = cleanedText.substring(0, gigRadarIndex).lastIndexOf('More...');
        if (cutoff !== -1 && (gigRadarIndex - cutoff) < 50) {
            return stripUiTags(cleanedText.substring(0, cutoff).trim());
        }

        // If "More..." isn't immediately preceding, just cut a bit before the score
        // The score often looks like "📡 38%\nGigRadar Score"
        const fallbackCutoff = cleanedText.lastIndexOf('\n', gigRadarIndex - 5);
        if (fallbackCutoff !== -1) {
            return stripUiTags(cleanedText.substring(0, fallbackCutoff).trim());
        }

        return stripUiTags(cleanedText.substring(0, gigRadarIndex).trim());
    }

    // Fallback: If "GigRadar Score" isn't found but "Talent Preference" or "Total Spent" is:
    const altCutoff = cleanedText.search(/(Talent Preference|Total Spent|Company Size|Client Feedback|Extracting\.\.\.)/i);
    if (altCutoff !== -1) {
        const fallbackCutoff2 = cleanedText.lastIndexOf('\n', altCutoff);
        if (fallbackCutoff2 !== -1) return stripUiTags(cleanedText.substring(0, fallbackCutoff2).trim());
        return stripUiTags(cleanedText.substring(0, altCutoff).trim());
    }

    return stripUiTags(cleanedText.trim());
}

function stripTimestamps(text: string): string {
    if (!text) return text;
    let cleaned = text;
    // Remove lines that are just dates like "a month ago", "21 days ago", "just now", "yesterday", "today"
    // Using multiline flag so ^ matches start of a line
    cleaned = cleaned.replace(/^[ \t]*(?:Posted\s*)?(?:about\s+|over\s+|almost\s+)?(?:a|an|\d+)\s+(?:second|minute|hour|day|week|month|year)s?\s+ago[ \t]*\n/gmi, '');
    cleaned = cleaned.replace(/^[ \t]*(?:just now|today|yesterday)[ \t]*\n/gmi, '');
    return cleaned;
}

function stripUiTags(text: string): string {
    if (!text) return text;
    let cleaned = text;
    // Remove hanging "More..." or "Less" words commonly found at the bottom of the visible job description
    cleaned = cleaned.replace(/(?:^|\n)(?:More\.\.\.|Less)\s*$/i, '');
    cleaned = cleaned.replace(/(?:^|\n)(?:More\.\.\.|Less)\s*$/i, ''); // run twice if both exist
    return cleaned.trim();
}
