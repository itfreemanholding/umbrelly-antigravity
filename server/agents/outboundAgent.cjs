const cron = require('node-cron');
const fetch = require('node-fetch');
const Anthropic = require('@anthropic-ai/sdk');

let pool;
let anthropic;

function initAgent(databasePool, anthropicInstance) {
    pool = databasePool;
    anthropic = anthropicInstance;

    // Run every 2 minutes for MVP demo
    cron.schedule('*/2 * * * *', async () => {
        try {
            const activeProjectsRes = await pool.query("SELECT project_id FROM settings WHERE key = 'agent_status' AND value = 'running'");
            const activeProjectIds = activeProjectsRes.rows.map(r => r.project_id);

            if (activeProjectIds.length === 0) return; // Silent return if agent is paused everywhere

            for (const projectId of activeProjectIds) {
                await executeOutboundCycle(projectId);
            }
        } catch (err) {
            console.error("Agent CRON failed:", err.message);
        }
    });

    console.log('[AGENT] Booking Agent Cron Job Initialized (Running every 2 mins)');
}

async function logAction(projectId, type, message) {
    try {
        const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await pool.query(`INSERT INTO agent_logs (id, project_id, timestamp, component, type, message) VALUES ($1, $2, $3, $4, $5, $6)`, 
            [logId, projectId, new Date().toISOString(), 'OUTBOUND_AGENT', type, message]);
        console.log(`[AGENT ${type.toUpperCase()}] Project ${projectId}: ${message}`);
    } catch (e) {
        console.error("Failed to write to agent_logs", e);
    }
}

async function executeOutboundCycle(projectId) {
    await logAction(projectId, 'action', 'Waking up. Starting outbound cycle...');

    // 1. Check for API Keys
    const resendRes = await pool.query("SELECT value FROM settings WHERE key = 'resend_key' AND project_id = $1", [projectId]);
    if (resendRes.rows.length === 0 || !resendRes.rows[0].value) {
        await logAction(projectId, 'error', 'Missing Resend API Key. Cannot send emails. Aborting cycle.');
        return;
    }
    const resendKeyRecord = resendRes.rows[0];

    const calendlyRes = await pool.query("SELECT value FROM settings WHERE key = 'calendly_url' AND project_id = $1", [projectId]);
    const calendlyUrl = calendlyRes.rows.length > 0 ? calendlyRes.rows[0].value : 'https://calendly.com';

    // 2. Fetch highly qualified jobs
    const jobsRes = await pool.query('SELECT json_data FROM saved_jobs WHERE project_id = $1', [projectId]);
    const parsedJobs = jobsRes.rows.map(j => JSON.parse(j.json_data));

    const qualifiedJobs = parsedJobs.filter(j => j.matchScore >= 8);

    if (qualifiedJobs.length === 0) {
        await logAction(projectId, 'action', 'No highly qualified jobs (Score >= 8) found in Data Hub. Going back to sleep.');
        return;
    }

    const targetJob = qualifiedJobs[Math.floor(Math.random() * qualifiedJobs.length)];
    await logAction(projectId, 'action', `Selected Target: ${targetJob.company || 'Unknown Company'} - ${targetJob.title} (Score: ${targetJob.matchScore})`);

    // 3. Draft Email using Claude
    await logAction(projectId, 'action', 'Drafting personalized pitch via Claude 3.5 Sonnet...');
    let draftText = '';

    try {
        const prompt = `You are an expert B2B copywriter. Write a highly personalized, single cold email to the hiring manager for this position:
Title: ${targetJob.title}
Job Description: ${targetJob.description.substring(0, 1000)}...

The goal is to offer a Free Cloud Architecture Audit to save them money on AWS/GCP, since they are clearly hiring DevOps. 
Include this booking link naturally: ${calendlyUrl}

Format the output strictly as:
Subject: [Your Subject Line]
[Body of the email]`;

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            system: "You write concise, punchy cold emails. No fluff. Get straight to the value.",
            messages: [{ role: "user", content: prompt }]
        });

        draftText = msg.content[0].text;
        await logAction(projectId, 'success', 'Draft generated successfully.');

    } catch (err) {
        await logAction(projectId, 'error', `Failed to generate draft: ${err.message}`);
        return;
    }

    // 4. Send Email via Resend
    await logAction(projectId, 'action', 'Attempting to dispatch email via Resend API...');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // DRY RUN MOCKUP log
    await logAction(projectId, 'success', `DRY RUN: Sent email to hiring@company.com.\n\nPreview:\n${draftText.substring(0, 100)}...`);

    // Example Actual API Call (Commented out)
    /*
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${resendKeyRecord.value}\`
            },
            body: JSON.stringify({
                from: 'Agent <agent@your-purchased-domain.xyz>',
                to: ['test@example.com'],
                subject: 'Cloud Audit',
                text: draftText
            })
        });
        
        if (response.ok) {
            await logAction(projectId, 'success', \`Email dispatched successfully to target.\`);
        } else {
            const err = await response.json();
            await logAction(projectId, 'error', \`Resend API rejected email: \${err.message}\`);
        }
    } catch (err) {
         await logAction(projectId, 'error', \`Network error during sending: \${err.message}\`);
    }
    */

    await logAction(projectId, 'action', 'Cycle complete. Sleeping.');
}

module.exports = {
    initAgent
};
