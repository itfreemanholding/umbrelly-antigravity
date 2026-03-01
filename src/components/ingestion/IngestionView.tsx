import { useState, useEffect } from 'react';
import { FileText, Database, ArrowRight, CheckCircle2 } from 'lucide-react';
import { parseGigRadarText } from '../../utils/parser';
import type { ParsedJob } from '../../utils/parser';
import './IngestionView.css';

interface IngestionViewProps {
    onSubmit: (job: ParsedJob) => void;
    onNavigateToData?: () => void;
}

export function IngestionView({ onSubmit, onNavigateToData }: IngestionViewProps) {
    const [activeTab, setActiveTab] = useState<'gigradar' | 'quote'>('gigradar');
    const [content, setContent] = useState('');
    const [matchScore, setMatchScore] = useState(10);
    const [memo, setMemo] = useState('');
    const [booleanSearch, setBooleanSearch] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (showSuccess) {
            timer = setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [showSuccess]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            const baseJob = {
                id: Date.now().toString(),
                matchScore,
                memo,
                booleanSearch,
                dateIngested: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                budget: '-',
                duration: '-',
                totalSpent: '-',
                clientCountry: '-',
                title: activeTab === 'quote' ? 'Direct Quote' : 'Unknown Title',
                description: activeTab === 'quote' ? content : 'No description extracted',
                rawText: content
            };

            const parsed = activeTab === 'gigradar' ? parseGigRadarText(content) : {};
            const finalJob: ParsedJob = { ...baseJob, ...parsed } as ParsedJob;

            onSubmit(finalJob);

            // Show success toast and clear input
            setShowSuccess(true);
            setContent('');
            setMemo('');
            setMatchScore(10);
            setBooleanSearch('');
        }
    };

    return (
        <>
            {showSuccess && (
                <div className="success-toast">
                    <CheckCircle2 color="var(--success)" size={24} />
                    <div className="toast-content">
                        <h4>Data Successfully Ingested!</h4>
                        <p>The job data and metrics have been extracted and saved.</p>
                    </div>
                    {onNavigateToData && (
                        <a
                            href="?view=data"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="toast-action"
                            style={{ textDecoration: 'none' }}
                        >
                            View in Data Hub
                        </a>
                    )}
                </div>
            )}

            <div className="ingestion-container fade-in-up">
                <div className="ingestion-header">
                    <h1 className="text-gradient">Ingest Customer Data</h1>
                    <p className="subtitle">Feed the RevOps engine with Upwork posts, demo transcripts, or direct quotes.</p>
                </div>



                <div className="glass-panel ingestion-panel">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'gigradar' ? 'active' : ''}`}
                            onClick={() => setActiveTab('gigradar')}
                        >
                            <Database size={18} />
                            Raw Gigradar
                        </button>
                        <button
                            className={`tab ${activeTab === 'quote' ? 'active' : ''}`}
                            onClick={() => setActiveTab('quote')}
                        >
                            <FileText size={18} />
                            Quote
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="ingestion-form">
                        <div className="input-group">
                            <label>{activeTab === 'gigradar' ? 'Paste Gigradar Job Description' : 'Paste Direct Quote'}</label>
                            <textarea
                                className="input-area"
                                placeholder={activeTab === 'gigradar' ? "e.g. AWS cost optimisation audit and implementation for SaaS platform..." : "e.g. 'We need someone to help us lower our AWS bills'"}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={5}
                            />
                        </div>

                        <div className="ingestion-metadata" style={{ marginTop: '12px' }}>
                            <div className="input-row" style={{ display: 'flex', gap: '16px' }}>
                                <div className="input-group flex-1" style={{ flex: 1 }}>
                                    <label>Initial Match Score: {matchScore}/10</label>
                                    <div className="rating-slider-container" style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={matchScore}
                                            onChange={(e) => setMatchScore(parseInt(e.target.value))}
                                            className="rating-slider"
                                            style={{ flex: 1, WebkitAppearance: 'none', appearance: 'none', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
                                        />
                                        <span className={`rating-badge small ${matchScore >= 8 ? 'high' : matchScore >= 5 ? 'med' : 'low'}`} style={{ marginLeft: '12px' }}>
                                            {matchScore}/10
                                        </span>
                                    </div>
                                </div>
                                <div className="input-group flex-1" style={{ flex: 1 }}>
                                    <label>GigRadar Boolean Used (Optional)</label>
                                    <input
                                        type="text"
                                        className="input-area"
                                        style={{ height: '42px' }}
                                        placeholder="e.g. (AWS | Amazon) (Cost | Reduce)"
                                        value={booleanSearch}
                                        onChange={(e) => setBooleanSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="input-group" style={{ marginTop: '12px', marginBottom: '8px' }}>
                                <label>Match Rationale / Memo (Optional)</label>
                                <textarea
                                    className="input-area"
                                    style={{ minHeight: '60px' }}
                                    placeholder="Why is this a 10/10? Any specific observations?"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '20px' }}>
                            <button
                                type="submit"
                                className="primary-btn pulse-glow"
                                disabled={!content.trim()}
                            >
                                Analyze Needs & Generate Assets
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
