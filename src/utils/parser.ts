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

export function parseGigRadarText(text: string): Partial<ParsedJob> {
    if (!text) return {};

    const rawLines = text.split('\n');
    const lines = rawLines.map(l => l.trim()).filter(line => line.length > 0);

    if (lines.length < 3) {
        // If it's too short, just treat the whole thing as a description
        return { title: 'Unknown Title', scannerName: 'Unknown Scanner', description: text };
    }

    // Clean up title (remove trailing timestamps like '21 days ago' or 'a month ago')
    let title = lines[0].replace(/(?:\s*[-,|]?\s*)(?:a|\d+)\s+(?:second|minute|hour|day|month|year)s?\s+ago\s*$/i, '').trim();
    title = title.replace(/(?:\s*[-,|]?\s*)(?:just now|today|yesterday)\s*$/i, '').trim();

    // Build description from rawLines to preserve formatting
    let descriptionRawLines: string[] = [];
    let skills: string[] = [];
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
        if (firstLine.match(/^(a|\d+)\s+(minute|hour|day|month|year)s?\s+ago$/)) {
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
