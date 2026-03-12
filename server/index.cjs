const express = require('express');
const cors = require('cors');
const { pool, getProjects, createProject, renameProject, deleteProject } = require('./db.cjs');

const app = express();
app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'x-project-id'] }));
app.use(express.json({ limit: '10mb' }));

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
    apiKey: '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'
});

const { initAgent } = require('./agents/outboundAgent.cjs');
initAgent(pool, anthropic);

// --- Middleware: Extract Project ID ---
function getProjectId(req, res, next) {
    const projectId = req.headers['x-project-id'];
    if (!projectId) {
        return res.status(400).json({ error: "x-project-id header is required" });
    }
    req.projectId = projectId;
    next();
}

// --- Projects API (No middleware to fetch all/create) ---
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await getProjects();
        res.json({ projects, activeProject: projects.length > 0 ? projects[0].id : '' }); // Provide active fallback
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects', async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) throw new Error("Project name is required");
        const project = await createProject(name);
        res.json({ success: true, project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects/switch', (req, res) => {
    res.json({ success: true });
});

app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        if (!name) throw new Error("New project name is required");
        const updatedProject = await renameProject(id, name);
        res.json({ success: true, project: updatedProject });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteProject(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Jobs API ---
app.get('/api/jobs', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM saved_jobs WHERE project_id = $1', [req.projectId]);
        const formatted = result.rows.map(j => JSON.parse(j.json_data));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/jobs', getProjectId, async (req, res) => {
    const job = req.body;
    try {
        await pool.query(`
            INSERT INTO saved_jobs (id, project_id, json_data)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET json_data = EXCLUDED.json_data
        `, [job.id, req.projectId, JSON.stringify(job)]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/jobs/:id', getProjectId, async (req, res) => {
    const job = req.body;
    const { id } = req.params;
    try {
        await pool.query(`
            UPDATE saved_jobs SET json_data = $1 WHERE id = $2 AND project_id = $3
        `, [JSON.stringify(job), id, req.projectId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/jobs/:id', getProjectId, async (req, res) => {
    try {
        await pool.query('DELETE FROM saved_jobs WHERE id = $1 AND project_id = $2', [req.params.id, req.projectId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Scanner Ideas API ---
app.get('/api/ideas', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM scanner_ideas WHERE project_id = $1 ORDER BY dateSaved DESC', [req.projectId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ideas', getProjectId, async (req, res) => {
    const idea = req.body;
    try {
        await pool.query(`
            INSERT INTO scanner_ideas (id, project_id, query, matchesIncluded, matchesTotal, rejectionsExcluded, rejectionsTotal, dateSaved)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET query = EXCLUDED.query, matchesIncluded = EXCLUDED.matchesIncluded, matchesTotal = EXCLUDED.matchesTotal, rejectionsExcluded = EXCLUDED.rejectionsExcluded, rejectionsTotal = EXCLUDED.rejectionsTotal, dateSaved = EXCLUDED.dateSaved
        `, [idea.id, req.projectId, idea.query, idea.matchesIncluded, idea.matchesTotal, idea.rejectionsExcluded, idea.rejectionsTotal, idea.dateSaved]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/ideas/:id', getProjectId, async (req, res) => {
    try {
        await pool.query('DELETE FROM scanner_ideas WHERE id = $1 AND project_id = $2', [req.params.id, req.projectId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Settings API (Gemini Key) ---
app.get('/api/settings/:key', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT value FROM settings WHERE key = $1 AND project_id = $2', [req.params.key, req.projectId]);
        res.json({ value: result.rows.length > 0 ? result.rows[0].value : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', getProjectId, async (req, res) => {
    const { key, value } = req.body;
    try {
        await pool.query(`
            INSERT INTO settings (key, project_id, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (key, project_id) DO UPDATE SET value = EXCLUDED.value
        `, [key, req.projectId, value]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Agent API ---
app.get('/api/agent-logs', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM agent_logs WHERE project_id = $1 ORDER BY timestamp DESC LIMIT 50', [req.projectId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/agent/toggle', getProjectId, async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query(`
            INSERT INTO settings (key, project_id, value) VALUES ('agent_status', $1, $2)
            ON CONFLICT (key, project_id) DO UPDATE SET value = EXCLUDED.value
        `, [req.projectId, status]);

        const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await pool.query(`
            INSERT INTO agent_logs (id, project_id, timestamp, component, type, message)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [logId, req.projectId, new Date().toISOString(), 'SYSTEM', 'action', `Booking Agent was ${status === 'running' ? 'started' : 'stopped'} by user.`]);

        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Utility to Clean Job Descriptions ---
function cleanJobText(rawText) {
    if (!rawText) return '';
    let cleanedText = stripTimestamps(rawText);
    const gigRadarIndex = cleanedText.search(/GigRadar Score/i);
    if (gigRadarIndex !== -1) {
        const cutoff = cleanedText.substring(0, gigRadarIndex).lastIndexOf('More...');
        if (cutoff !== -1 && (gigRadarIndex - cutoff) < 50) return stripUiTags(cleanedText.substring(0, cutoff).trim());
        const fallbackCutoff = cleanedText.lastIndexOf('\n', gigRadarIndex - 5);
        if (fallbackCutoff !== -1) return stripUiTags(cleanedText.substring(0, fallbackCutoff).trim());
        return stripUiTags(cleanedText.substring(0, gigRadarIndex).trim());
    }
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

// --- Claude API ---
app.post('/api/claude/outreach', getProjectId, async (req, res) => {
    try {
        const { jobs, option, customPrompt, masterPrompt } = req.body;
        console.log("Outreach Request Received. Jobs:", jobs.length, "Option:", option);
        const jobContext = jobs.map((j) => {
            const cleanText = cleanJobText(j.rawText);
            return `Title: ${j.title}\nCompany: ${j.company || 'Unknown'}\nDescription: ${cleanText}`;
        }).join('\n\n---\n\n');

        let systemMsg = masterPrompt || "You are an expert B2B copywriter specializing in cold outreach. Your task is to analyze the provided job descriptions and generate a highly converting outreach sequence.";
        let strategyContext = "";

        if (option === 'direct') strategyContext = "Use a Direct Pitch strategy: Get straight to the point highlighting the ROI and value proposition.";
        else if (option === 'audit') strategyContext = "Use a Free Audit Offer strategy: Take a value-first approach offering a micro-consultation or free audit.";
        else if (option === 'pain') strategyContext = "Use a Pain Point Agitation strategy: Emphasize their specific struggles found in the job descriptions before offering a solution.";

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
        await pool.query(`
            INSERT INTO outreach_ideas (id, project_id, strategy, customPrompt, generatedText, dateSaved)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [ideaId, req.projectId, option, customPrompt || '', resultText, new Date().toISOString()]);

        res.json({ result: resultText, promptSent: prompt, systemSent: systemMsg, id: ideaId });
    } catch (err) {
        console.error("Outreach Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/claude/google-ads', getProjectId, async (req, res) => {
    try {
        const { jobs, option, customPrompt, masterPrompt } = req.body;
        console.log("Google Ads Request Received. Jobs:", jobs.length, "Option:", option);
        const jobContext = jobs.map((j) => {
            const cleanText = cleanJobText(j.rawText);
            return `Title: ${j.title}\nCompany: ${j.company || 'Unknown'}\nDescription: ${cleanText}`;
        }).join('\n\n---\n\n');

        let systemMsg = masterPrompt || "You are an expert B2B Search Engine Marketing (SEM) strategist. Your task is to analyze the provided job descriptions and generate highly relevant Google Ads keyword sets and ad copy architectures.";
        let strategyContext = "";

        if (option === 'intent') strategyContext = "Focus on High Intent / High Competition keywords. Formulate extremely targeted phrases (Exact Match and Phrase Match) that indicate a readiness to purchase our technical consulting/solution.";
        else if (option === 'longtail') strategyContext = "Focus on Long Tail / Low Competition keywords. Identify highly specific, niche technical problem descriptions that have lower search volume but extreme relevance to these jobs.";
        else if (option === 'negative') strategyContext = "Focus on Negative Keywords & Exclusions. Analyze the data to determine broad terms, informational queries, or adjacent technologies we should strictly EXCLUDE to avoid wasting ad spend.";

        const prompt = `Here are the job descriptions of our approved matches:\n\n${jobContext}\n\n${strategyContext}\n\n${customPrompt ? 'Additional Custom Instructions: ' + customPrompt + '\n\n' : ''}Generate a comprehensive output structured in Markdown. Include:\n1. Recommended Keywords\n2. Suggested Ad Group Structure\n3. 2-3 sample Google Ad copy variations targeting the core pain points.\n\nAT THE VERY END of your response, output a JSON array of the recommended keywords enclosed in \`\`\`json \`\`\` blocks. Each object must have the following keys:\n- "keyword" (string): The actual search phrase.\n- "category" (string): A short category tag (e.g., 'Core', 'Technical', 'Commercial', 'Adjacent').\n- "competition" (string): Estimated competition ('High', 'Medium', 'Low').\n- "useCases" (string): Comma-separated recommended usage (e.g., 'Google Ads, SEO, Landing page').\n\nExample JSON: [{"keyword": "real estate tokenization", "category": "Core", "competition": "High", "useCases": "Google Ads, SEO"}]`;

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            system: systemMsg,
            messages: [{ role: "user", content: prompt }]
        });

        console.log("Google Ads Success");
        let resultText = msg.content[0].text;

        let jsonArray = [];
        let markdownOutput = resultText;
        let keywordsCount = 0;

        const jsonBlockMatch = resultText.match(/```json([\s\S]*?)```/i);
        if (jsonBlockMatch) {
            try {
                jsonArray = JSON.parse(jsonBlockMatch[1].trim());
                markdownOutput = resultText.replace(jsonBlockMatch[0], '').trim();
            } catch (e) {
                console.error("Failed to parse extracted JSON block:", e);
            }
        } else {
            const arrayMatch = resultText.match(/\[([\s\S]*)\]/);
            if (arrayMatch) {
                try {
                    jsonArray = JSON.parse(arrayMatch[0]);
                    markdownOutput = resultText.replace(arrayMatch[0], '').trim();
                } catch (e) { }
            }
        }

        for (const kw of jsonArray) {
            const kwId = 'kw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await pool.query(`
                INSERT INTO google_ads_keywords (id, project_id, keyword, category, competition, useCases, dateSaved)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [kwId, req.projectId, kw.keyword, kw.category || '', kw.competition || '', kw.useCases || '', new Date().toISOString()]);
            keywordsCount++;
        }

        const ideaId = 'gai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const dateSaved = new Date().toISOString();
        await pool.query(`
            INSERT INTO google_ads_ideas (id, project_id, strategy, customPrompt, generatedText, dateSaved)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [ideaId, req.projectId, option, customPrompt || '', markdownOutput, dateSaved]);

        const idea = { id: ideaId, strategy: option, customPrompt, generatedText: markdownOutput, dateSaved };

        res.json({ markdown: markdownOutput, keywordsCount, idea, promptSent: prompt, systemSent: systemMsg });
    } catch (err) {
        console.error("Google Ads Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Google Ads Keywords API ---
app.get('/api/keywords', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM google_ads_keywords WHERE project_id = $1 ORDER BY dateSaved DESC', [req.projectId]);
        const mappedRows = result.rows.map(row => ({
            id: row.id,
            keyword: row.keyword,
            category: row.category,
            competition: row.competition,
            useCases: row.usecases,
            dateSaved: row.datesaved
        }));
        res.json(mappedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/keywords', getProjectId, async (req, res) => {
    const kw = req.body;
    try {
        await pool.query(`
            INSERT INTO google_ads_keywords (id, project_id, keyword, category, competition, useCases, dateSaved)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET keyword = EXCLUDED.keyword, category = EXCLUDED.category, competition = EXCLUDED.competition, useCases = EXCLUDED.useCases, dateSaved = EXCLUDED.dateSaved
        `, [kw.id, req.projectId, kw.keyword, kw.category, kw.competition, kw.useCases, kw.dateSaved]);
        res.json({ success: true, id: kw.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/keywords/:id', getProjectId, async (req, res) => {
    try {
        await pool.query('DELETE FROM google_ads_keywords WHERE id = $1 AND project_id = $2', [req.params.id, req.projectId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/claude/pattern-engine', async (req, res) => {
    try {
        const { matches, rejections, baseBoolean } = req.body;
        const matchContext = matches.map(m => `MATCH: ${m.title} ${cleanJobText(m.rawText).substring(0, 500)}`).join('\n');
        const rejContext = rejections.map(m => `REJECTION: ${m.title} ${cleanJobText(m.rawText).substring(0, 500)}`).join('\n');

        const prompt = `You are an expert Boolean search string generator for a recruitment platform.\nI will give you a list of "MATCH" jobs and "REJECTION" jobs.\nYour task is to analyze the patterns and generate 5 optimized Boolean search strings that will include the MATCHes but exclude the REJECTIONs.\nKeep them concise and effective.\n\nBase boolean to start with: ${baseBoolean || ''}\n${matchContext.substring(0, 5000)}\n${rejContext.substring(0, 5000)}\n\nReturn EXACTLY a JSON array of 5 strings representing the 5 boolean queries. Do NOT return any markdown formatting outside of the JSON array. Example: ["(A AND B)", "(C OR D)", "(A AND (B OR C))", "((A OR B) AND C)", "(E AND D)"]`;

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
        res.json({ queries });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Outreach Ideas API ---
app.get('/api/outreach-ideas', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM outreach_ideas WHERE project_id = $1 ORDER BY dateSaved DESC', [req.projectId]);
        const mappedRows = result.rows.map(row => ({
            id: row.id,
            strategy: row.strategy,
            customPrompt: row.customprompt,
            generatedText: row.generatedtext,
            dateSaved: row.datesaved
        }));
        res.json(mappedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/outreach-ideas/:id', getProjectId, async (req, res) => {
    try {
        await pool.query('DELETE FROM outreach_ideas WHERE id = $1 AND project_id = $2', [req.params.id, req.projectId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Google Ads Ideas API ---
app.get('/api/google-ads-ideas', getProjectId, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM google_ads_ideas WHERE project_id = $1 ORDER BY dateSaved DESC', [req.projectId]);
        const mappedRows = result.rows.map(row => ({
            id: row.id,
            strategy: row.strategy,
            customPrompt: row.customprompt,
            generatedText: row.generatedtext,
            dateSaved: row.datesaved
        }));
        res.json(mappedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/google-ads-ideas/:id', getProjectId, async (req, res) => {
    try {
        await pool.query('DELETE FROM google_ads_ideas WHERE id = $1 AND project_id = $2', [req.params.id, req.projectId]);
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
    console.log(`Express API running on port ${PORT}`);
});
