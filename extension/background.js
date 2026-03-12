// RevOps Background Worker

function cleanJobTitle(title) {
    if (!title) return '';
    let cleaned = title.replace(/(?:\s*[-,|]?\s*)(?:Posted\s*)?(?:about\s+|over\s+|almost\s+)?(?:a|an|\d+)\s+(?:second|minute|hour|day|month|year)s?\s+ago[\s\S]*$/i, '').trim();
    cleaned = cleaned.replace(/(?:\s*[-,|]?\s*)(?:just now|today|yesterday)[\s\S]*$/i, '').trim();
    return cleaned;
}

function parseGigRadarText(text, incomingTitle) {
    if (!text) return {};

    const rawLines = text.split('\n');
    const lines = rawLines.map(l => l.trim()).filter(line => line.length > 0);

    let title = cleanJobTitle(lines.length > 0 ? lines[0] : incomingTitle || 'Unknown Position');

    const descriptionRawLines = [];
    const skills = [];
    let budget = '-', duration = '-', totalSpent = '-', clientCountry = '-';
    let gigRadarScore = '-', talentPreference = '-', experienceLevel = '-', hourlyLoad = '-', avgRatePaid = '-', companySize = '-', paymentType = '-';
    let paymentVerified = false, clientFeedback = '-', memberSince = '-', postedTimeAgo = 'Just now', cloudTag = 'Other';

    let parsingDescription = true;

    for (let i = 1; i < rawLines.length; i++) {
        const rawLine = rawLines[i];
        const line = rawLine.trim();

        if (line === '') {
            if (parsingDescription) descriptionRawLines.push(rawLine);
            continue;
        }

        const isMetricStart = line.match(/^[📡⭐️]/) || line === 'GigRadar Score' || line === 'Fixed-Price' || line === 'Hourly' || line === 'Talent Preference';

        if (parsingDescription && isMetricStart) {
            parsingDescription = false;
            let j = descriptionRawLines.length - 1;
            while (j >= 0 && descriptionRawLines[j].length < 60 && !descriptionRawLines[j].endsWith('.') && !descriptionRawLines[j].endsWith('!') && !descriptionRawLines[j].endsWith(':')) {
                if (descriptionRawLines[j] !== 'More...') skills.unshift(descriptionRawLines[j]);
                descriptionRawLines.pop();
                j--;
            }
        }

        const isDateLine = i < 5 && (line.includes('days ago') || line.includes('hours ago') || line.includes('minutes ago') || line.includes('months ago'));
        if (isDateLine) postedTimeAgo = line;

        if (parsingDescription && line !== 'More...' && !isDateLine && !isMetricStart) descriptionRawLines.push(rawLine);
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === 'GigRadar Score') gigRadarScore = i > 0 ? lines[i - 1].replace(/📡\s*/, '').trim() : '-';
        if (line === 'Fixed-Price' || line === 'Budget') { budget = i > 0 ? lines[i - 1] : '-'; paymentType = 'Fixed Price'; }
        if (line === 'Hourly' || line === 'Hourly Rate') { budget = i > 0 ? lines[i - 1] : '-'; paymentType = 'Hourly'; }
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

    while (descriptionRawLines.length > 0 && descriptionRawLines[0].trim() === '') descriptionRawLines.shift();
    if (descriptionRawLines.length > 0) {
        const firstLine = descriptionRawLines[0].trim().toLowerCase();
        if (firstLine.match(/^(?:posted\s*)?(?:about\s+|over\s+|almost\s+)?(a|an|\d+)\s+(minute|hour|day|month|year)s?\s+ago$/)) {
            descriptionRawLines.shift();
            while (descriptionRawLines.length > 0 && descriptionRawLines[0].trim() === '') descriptionRawLines.shift();
        }
    }

    const description = descriptionRawLines.join('\n');
    const fullTextUpper = (title + ' ' + description).toUpperCase();
    if (fullTextUpper.includes('AWS') || fullTextUpper.includes('AMAZON WEB SERVICES')) cloudTag = 'AWS';
    else if (fullTextUpper.includes('GCP') || fullTextUpper.includes('GOOGLE CLOUD')) cloudTag = 'GCP';
    else if (fullTextUpper.includes('AZURE')) cloudTag = 'Azure';

    return {
        title,
        description: description || 'No description extracted',
        skills, gigRadarScore, talentPreference, experienceLevel,
        hourlyLoad, avgRatePaid, companySize, paymentType,
        paymentVerified, clientFeedback, memberSince, budget,
        duration, totalSpent, clientCountry, postedTimeAgo, cloudTag
    };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_JOB') {
        const rawJob = message.job;
        
        chrome.storage.local.get(['activeProjectId'], (result) => {
            const projectId = result.activeProjectId;
            
            if (!projectId) {
                console.error("No active project ID selected in extension!");
                sendResponse({ success: false, error: 'NO_PROJECT_SELECTED' });
                return;
            }

            // Parse before sending
            const parsedData = parseGigRadarText(rawJob.rawText, rawJob.title);
            const finalPayload = {
                ...parsedData,
                id: rawJob.id,
                scannerName: rawJob.scannerName || "",
                booleanSearch: rawJob.booleanSearch || "",
                matchScore: rawJob.isMatch ? 10 : 1,
                dateIngested: rawJob.dateRecorded || new Date().toISOString(),
                rawText: rawJob.rawText
            };

            fetch('http://localhost:3001/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-project-id': projectId
                },
                body: JSON.stringify(finalPayload)
            })
            .then(res => {
                if (res.ok) {
                    sendResponse({ success: true });
                    // Ping any open React tabs to gracefully reload the API data
                    chrome.tabs.query({ url: "http://localhost:5174/*" }, (tabs) => {
                        for (let tab of tabs) {
                            chrome.tabs.sendMessage(tab.id, { type: 'SYNC_NOW' });
                        }
                    });
                } else {
                    sendResponse({ success: false, error: 'BACKEND_REJECTED' });
                }
            })
            .catch(err => {
                console.error("Failed to push to API", err);
                sendResponse({ success: false, error: 'NETWORK_ERROR' });
            });
        });
        
        return true; // Keep message channel open for async fetch
    }
});
