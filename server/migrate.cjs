const Database = require('better-sqlite3');
const { Pool } = require('pg');

const sqliteDb = new Database('server/database.sqlite');
const pool = new Pool({ connectionString: 'postgres://localhost/umbrelly_revops' });

async function run() {
    const res = await pool.query("SELECT id, name FROM projects WHERE name ILIKE '%umbrelly%'");
    const projectId = res.rows[0]?.id;
    if (!projectId) { console.log('Project not found'); process.exit(1); }

    const ideas = sqliteDb.prepare('SELECT * FROM outreach_ideas').all();
    for (const idea of ideas) {
        try {
            await pool.query(
                `INSERT INTO outreach_ideas (id, project_id, strategy, customPrompt, generatedText, dateSaved)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`,
                [idea.id, projectId, idea.strategy, idea.customPrompt, idea.generatedText, idea.dateSaved]
            );
            console.log(`Migrated outreach idea: ${idea.id}`);
        } catch (e) {
            console.error(e);
        }
    }
    console.log('Done migrating outreach ideas.');
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
