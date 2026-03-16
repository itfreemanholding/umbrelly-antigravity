const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://localhost/umbrelly_revops'
});

async function initTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_jobs (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            json_data TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS scanner_ideas (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            query TEXT,
            matchesIncluded INTEGER,
            matchesTotal INTEGER,
            rejectionsExcluded INTEGER,
            rejectionsTotal INTEGER,
            dateSaved TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS outreach_ideas (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            strategy TEXT,
            customPrompt TEXT,
            generatedText TEXT,
            dateSaved TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS google_ads_ideas (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            strategy TEXT,
            customPrompt TEXT,
            generatedText TEXT,
            dateSaved TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            value TEXT,
            PRIMARY KEY (key, project_id)
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS google_ads_keywords (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            keyword TEXT NOT NULL,
            category TEXT,
            competition TEXT,
            useCases TEXT,
            dateSaved TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_logs (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            timestamp TEXT NOT NULL,
            component TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS hypotheses (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            economics JSONB,
            assumptions JSONB,
            experiment JSONB,
            description TEXT,
            date_created TEXT
        );
    `);

    // Ensure the description column exists for existing tables
    await pool.query(`ALTER TABLE hypotheses ADD COLUMN IF NOT EXISTS description TEXT;`).catch(console.error);
    
    // Ensure there is at least one active project, if not instantiate Default
    const res = await pool.query(`SELECT id FROM projects LIMIT 1`);
    if (res.rows.length === 0) {
        await pool.query(`INSERT INTO projects (name) VALUES ('Default Project')`);
    }
}

initTables().catch(console.error);

async function getProjects() {
    const res = await pool.query('SELECT id, name FROM projects ORDER BY created_at ASC');
    return res.rows;
}

async function createProject(name) {
    const res = await pool.query('INSERT INTO projects (name) VALUES ($1) RETURNING id, name', [name]);
    return res.rows[0];
}

async function renameProject(id, newName) {
    const res = await pool.query('UPDATE projects SET name = $1 WHERE id = $2 RETURNING id, name', [newName, id]);
    if (res.rows.length === 0) throw new Error("Project not found");
    return res.rows[0];
}

async function deleteProject(id) {
    const countRes = await pool.query('SELECT COUNT(*) FROM projects');
    if (parseInt(countRes.rows[0].count) <= 1) {
        throw new Error("Cannot delete the last remaining project.");
    }
    
    const res = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (res.rows.length === 0) throw new Error("Project not found");
    return { success: true };
}

module.exports = {
    pool,
    getProjects,
    createProject,
    renameProject,
    deleteProject
};
