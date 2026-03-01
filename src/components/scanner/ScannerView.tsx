import { useState } from 'react';
import { Search, Save, Trash2, Cpu, Database } from 'lucide-react';
import './ScannerView.css';

interface SavedJob {
    id: string;
    title: string;
    rating: number;
    rationale: string;
    date: string;
}

export function ScannerView() {


    // Form State
    const [jobText, setJobText] = useState('');
    const [rating, setRating] = useState(5);
    const [rationale, setRationale] = useState('');

    // Mock Knowledge Base Data
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([
        {
            id: '1',
            title: 'AWS cost optimisation audit and implementation for saad platform',
            rating: 8,
            rationale: 'Explicitly asks for a "comprehensive cost optimization audit for our SaaS platform".',
            date: 'Mar 1, 2026'
        },
        {
            id: '2',
            title: 'AWS Cloud Cost Optimization - Reduce Our $790/mo Bill',
            rating: 9,
            rationale: 'Highly specific budget and goal. Provides a very clear scope of work.',
            date: 'Mar 1, 2026'
        }
    ]);

    const handleSaveJob = (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobText.trim()) return;

        // Extract a mock title from the first line or use a generic one
        const firstLine = jobText.split('\n')[0].substring(0, 60);
        const newJob: SavedJob = {
            id: Date.now().toString(),
            title: firstLine || 'Drafted Job Posting',
            rating,
            rationale,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        setSavedJobs([newJob, ...savedJobs]);
        setJobText('');
        setRating(5);
        setRationale('');
    };

    return (
        <div className="scanner-container fade-in-up">
            <div className="scanner-header">
                <div>
                    <h1 className="text-gradient">Scanner Intelligence Hub</h1>
                    <p className="subtitle">Train the RevOps Engine to identify your Ideal Customer Profile (ICP).</p>
                </div>
            </div>

            <div className="scanner-layout">
                {/* Left Column: Data Entry */}
                <div className="scanner-input-section">
                    <div className="glass-panel panel-content">
                        <h2 className="panel-title">Add Training Data</h2>

                        <form onSubmit={handleSaveJob} className="scanner-form">
                            <div className="input-group">
                                <label>Paste Upwork Job Description</label>
                                <textarea
                                    className="input-area"
                                    placeholder="Paste the full job description here to analyze it..."
                                    value={jobText}
                                    onChange={(e) => setJobText(e.target.value)}
                                    rows={6}
                                />
                            </div>

                            <div className="input-row">
                                <div className="input-group flex-1">
                                    <label>Match Rating (1-10)</label>
                                    <div className="rating-slider-container">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={rating}
                                            onChange={(e) => setRating(parseInt(e.target.value))}
                                            className="rating-slider"
                                        />
                                        <span className={`rating-badge ${rating >= 8 ? 'high' : rating >= 5 ? 'med' : 'low'}`}>
                                            {rating}/10
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Why this rating? (Rationale)</label>
                                <textarea
                                    className="input-area"
                                    placeholder="e.g. Good fit because they specifically mention AWS EC2 costs, but docked 2 points because budget is slightly low."
                                    value={rationale}
                                    onChange={(e) => setRationale(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <button
                                type="submit"
                                className="primary-btn full-width"
                                disabled={!jobText.trim()}
                            >
                                <Save size={18} />
                                Save to Knowledge Base
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Knowledge Base & Booleans */}
                <div className="scanner-knowledge-section">
                    {/* Boolean Search Rules Viewer */}
                    <div className="glass-card boolean-card">
                        <div className="card-header-flex">
                            <h3 className="card-title">
                                <Search size={18} className="text-gradient" />
                                GigRadar Boolean Scanners
                            </h3>
                            <button className="icon-btn tooltip-trigger">
                                <Cpu size={18} />
                                <span className="tooltip">AI Generated based on saved jobs</span>
                            </button>
                        </div>

                        <div className="boolean-queries">
                            <div className="query-box">
                                <div className="query-label">Broad Cost Optimization</div>
                                <code className="query-code">("AWS" | (Amazon*)) ("cost optimization" | "reduce bill" | "cloud cost")</code>
                            </div>
                            <div className="query-box">
                                <div className="query-label">Specific Infrastructure Audits</div>
                                <code className="query-code">(EC2 | RDS | S3 | CloudWatch | VPC) (audit | optimize* | "reduce cost")</code>
                            </div>
                        </div>
                    </div>

                    {/* Saved Jobs List */}
                    <div className="glass-panel panel-content saved-jobs-panel">
                        <div className="panel-header-flex">
                            <h2 className="panel-title">Trained Examples</h2>
                            <span className="count-badge">{savedJobs.length} Jobs</span>
                        </div>

                        <div className="saved-jobs-list">
                            {savedJobs.map(job => (
                                <div key={job.id} className="saved-job-card stagger-1">
                                    <div className="job-header">
                                        <h4 className="job-title">{job.title}</h4>
                                        <span className={`rating-badge small ${job.rating >= 8 ? 'high' : job.rating >= 5 ? 'med' : 'low'}`}>
                                            {job.rating}/10
                                        </span>
                                    </div>
                                    <p className="job-rationale">{job.rationale}</p>
                                    <div className="job-footer">
                                        <span className="job-date">{job.date}</span>
                                        <button className="icon-btn small">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {savedJobs.length === 0 && (
                                <div className="empty-state">
                                    <Database size={32} color="var(--text-muted)" />
                                    <p>No jobs added to the knowledge base yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
