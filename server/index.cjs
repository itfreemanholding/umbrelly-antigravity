const express = require('express');
const cors = require('cors');
const db = require('./db.cjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
    apiKey: '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'
});

// --- Jobs API ---
app.get('/api/jobs', (req, res) => {
    try {
        const jobs = db.prepare('SELECT * FROM saved_jobs').all();
        const formatted = jobs.map(j => JSON.parse(j.json_data));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/jobs', (req, res) => {
    const job = req.body;
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO saved_jobs (id, json_data)
            VALUES (?, ?)
        `);
        stmt.run(job.id, JSON.stringify(job));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/jobs/:id', (req, res) => {
    const job = req.body;
    const { id } = req.params;
    try {
        const stmt = db.prepare(`
            UPDATE saved_jobs SET json_data = ? WHERE id = ?
        `);
        stmt.run(JSON.stringify(job), id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/jobs/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM saved_jobs WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Scanner Ideas API ---
app.get('/api/ideas', (req, res) => {
    try {
        const ideas = db.prepare('SELECT * FROM scanner_ideas').all();
        res.json(ideas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ideas', (req, res) => {
    const idea = req.body;
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO scanner_ideas (id, query, matchesIncluded, matchesTotal, rejectionsExcluded, rejectionsTotal, dateSaved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(idea.id, idea.query, idea.matchesIncluded, idea.matchesTotal, idea.rejectionsExcluded, idea.rejectionsTotal, idea.dateSaved);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/ideas/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM scanner_ideas WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Settings API (Gemini Key) ---
app.get('/api/settings/:key', (req, res) => {
    try {
        const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
        res.json({ value: setting ? setting.value : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO settings (key, value)
            VALUES (?, ?)
        `);
        stmt.run(key, value);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Utility to Clean Job Descriptions ---
function cleanJobText(rawText) {
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
    // Remove hanging "More..." or "Less" words commonly found at the bottom of the visible job description
    cleaned = cleaned.replace(/(?:^|\n)(?:More\.\.\.|Less)\s*$/i, '');
    cleaned = cleaned.replace(/(?:^|\n)(?:More\.\.\.|Less)\s*$/i, ''); // run twice if both exist
    return cleaned.trim();
}

// --- Claude API ---
app.post('/api/claude/outreach', async (req, res) => {
    try {
        const { jobs, option, customPrompt, masterPrompt } = req.body;
        console.log("Outreach Request Received. Jobs:", jobs.length, "Option:", option);
        const jobContext = jobs.map((j) => {
            const cleanText = cleanJobText(j.rawText);
            return `Title: ${j.title}\nCompany: ${j.company || 'Unknown'}\nDescription: ${cleanText}`;
        }).join('\n\n---\n\n');

        let systemMsg = masterPrompt || "You are an expert B2B copywriter specializing in cold outreach. Your task is to analyze the provided job descriptions and generate a highly converting outreach sequence.";
        let strategyContext = "";

        if (option === 'direct') {
            strategyContext = "Use a Direct Pitch strategy: Get straight to the point highlighting the ROI and value proposition.";
        } else if (option === 'audit') {
            strategyContext = "Use a Free Audit Offer strategy: Take a value-first approach offering a micro-consultation or free audit.";
        } else if (option === 'pain') {
            strategyContext = "Use a Pain Point Agitation strategy: Emphasize their specific struggles found in the job descriptions before offering a solution.";
        }

        const prompt = `Here are the job descriptions of our approved matches:\n\n${jobContext}\n\n${strategyContext}\n\n${customPrompt ? 'Additional Custom Instructions: ' + customPrompt + '\n\n' : ''}Generate the cold outreach sequence (Email 1, Email 2, Email 3, and a LinkedIn connection message). Use clear formatting.`;

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            system: systemMsg,
            messages: [{ role: "user", content: prompt }]
        });

        console.log("Outreach Success");
        const resultText = msg.content[0].text;

        const ideaId = 'outreach_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const stmt = db.prepare(`
            INSERT INTO outreach_ideas (id, strategy, customPrompt, generatedText, dateSaved)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(ideaId, option, customPrompt || '', resultText, new Date().toISOString());

        res.json({ result: resultText, promptSent: prompt, systemSent: systemMsg, id: ideaId });
    } catch (err) {
        console.error("Outreach Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/claude/pattern-engine', async (req, res) => {
    try {
        const { matches, rejections, baseBoolean } = req.body;
        console.log("Pattern Engine Request Received. Matches:", matches.length, "Rejections:", rejections.length);

        const matchContext = matches.map(m => `MATCH: ${m.title} ${cleanJobText(m.rawText).substring(0, 500)}`).join('\n');
        const rejContext = rejections.map(m => `REJECTION: ${m.title} ${cleanJobText(m.rawText).substring(0, 500)}`).join('\n');

        const prompt = `You are an expert Boolean search string generator for a recruitment platform.
I will give you a list of "MATCH" jobs and "REJECTION" jobs.
Your task is to analyze the patterns and generate 5 optimized Boolean search strings that will include the MATCHes but exclude the REJECTIONs.
Keep them concise and effective.

Base boolean to start with: ${baseBoolean || ''}
${matchContext.substring(0, 5000)}
${rejContext.substring(0, 5000)}

Return EXACTLY a JSON array of 5 strings representing the 5 boolean queries. Do NOT return any markdown formatting outside of the JSON array. Example: ["(A AND B)", "(C OR D)", "(A AND (B OR C))", "((A OR B) AND C)", "(E AND D)"]
        `;

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            system: "You are an expert Boolean search string generator. You must output EXACTLY a valid JSON array of 5 strings. NO markdown, NO text before or after, JUST the raw JSON array. If you output anything else, you will break the system.",
            messages: [{ role: "user", content: prompt }]
        });

        let text = msg.content[0].text.trim();
        if (text.startsWith('\`\`\`json')) text = text.replace(/\`\`\`json\n?/, '');
        if (text.startsWith('\`\`\`')) text = text.replace(/\`\`\`\n?/, '');
        text = text.replace(/\`\`\`\n?$/, '');

        const queries = JSON.parse(text);
        console.log("Pattern Engine Success, queries:", queries.length);
        res.json({ queries });
    } catch (err) {
        console.error('Claude API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Outreach Ideas API ---
app.get('/api/outreach-ideas', (req, res) => {
    try {
        const ideas = db.prepare('SELECT * FROM outreach_ideas ORDER BY dateSaved DESC').all();
        res.json(ideas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/outreach-ideas/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM outreach_ideas WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
    console.log(`Express SQLite API running on port ${PORT}`);
});
