import React, { useState } from 'react';
import { Settings, ThumbsUp, ThumbsDown, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGigRadarText } from '../../utils/parser';
import './ConfiguratorView.css';

interface ScannedJob {
    id: string;
    title: string;
    rawText: string;
    scannerName?: string;
    isMatch: boolean;
    booleanSearch?: string;
    dateRecorded: string;
}

export function ConfiguratorView() {
    const [scannedJobs, setScannedJobs] = useState<ScannedJob[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedBoolean, setGeneratedBoolean] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedId(prev => prev === id ? null : id);
    };
    React.useEffect(() => {
        const loadFromStorage = () => {
            try {
                const data = localStorage.getItem('revops_extension_sync');
                if (data) {
                    setScannedJobs(JSON.parse(data));
                }
            } catch (err) {
                console.error("Failed to parse sync data", err);
            }
        };

        // Initial load
        loadFromStorage();

        // Listen for updates dispatched by app-sync.js or other tabs
        window.addEventListener('storage', loadFromStorage);
        return () => window.removeEventListener('storage', loadFromStorage);
    }, []);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setGeneratedBoolean('');

        // Simulate AI analysis delay
        setTimeout(() => {
            setIsAnalyzing(false);
            setGeneratedBoolean('((AWS | Azure | GCP) & (Migration | Optimization | FinOps)) | ("Cloud Architect" & !Support)');
        }, 2000);
    };

    const matches = scannedJobs.filter(j => j.isMatch);
    const rejections = scannedJobs.filter(j => !j.isMatch);

    return (
        <div className="configurator-container fade-in-up">
            <div className="configurator-header">
                <div>
                    <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={28} />
                        Configuring Scanners
                    </h1>
                    <p className="subtitle">Sync data from the GigRadar Chrome Extension to configure and refine your Ideal Customer Profile.</p>
                </div>

                <div className="sync-status show-connected" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }}></div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Live Sync Active</span>
                </div>
            </div>

            <div className="configurator-dashboard">
                <div className="analysis-panel glass-panel">
                    <div className="panel-header">
                        <h3>Pattern Analysis Engine</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                            We compare your {matches.length} matches against {rejections.length} rejections to find the optimal search criteria.
                        </p>
                    </div>

                    <div className="analysis-actions">
                        <button
                            className="primary-btn pulse-glow"
                            onClick={runAnalysis}
                            disabled={scannedJobs.length === 0 || isAnalyzing}
                            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                        >
                            {isAnalyzing ? (
                                <>Processing NLP Models...</>
                            ) : (
                                <>
                                    <Zap size={20} />
                                    Analyze Patterns & Generate Boolean
                                </>
                            )}
                        </button>
                    </div>

                    {generatedBoolean && !isAnalyzing && (
                        <div className="generated-result fade-in">
                            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '8px', fontSize: '14px' }}>Optimized GigRadar Boolean:</h4>
                            <div className="boolean-code-block">
                                <code>{generatedBoolean}</code>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lists-container">
                    <div className="job-list-col match-col">
                        <div className="col-header match">
                            <ThumbsUp size={18} className="icon-match" />
                            <h3>Approved Matches ({matches.length})</h3>
                        </div>
                        <div className="job-cards-scroll">
                            {matches.length === 0 && <div className="empty-list">No matches synced yet.</div>}
                            {matches.map(job => {
                                const parsed = parseGigRadarText(job.rawText);
                                const isExpanded = expandedId === job.id;
                                return (
                                    <div key={job.id} className="job-card glass-panel" style={{ cursor: 'pointer', transition: 'all 0.2s', padding: isExpanded ? '20px' : '16px' }} onClick={(e) => toggleExpand(job.id, e)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', lineHeight: 1.4, fontSize: '14px' }}>{parsed.title || job.title}</h4>
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>

                                        {job.booleanSearch && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                <strong>Query:</strong> {job.booleanSearch}
                                            </div>
                                        )}

                                        {!isExpanded && (
                                            <p className="job-preview" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {parsed.description || job.rawText}
                                            </p>
                                        )}

                                        {isExpanded && (
                                            <div className="expanded-card-content fade-in" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                                                    {parsed.description}
                                                </div>

                                                {parsed.skills && parsed.skills.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                                        {parsed.skills.map((s, i) => <span key={i} style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{s}</span>)}
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.budget}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GigRadar Score</div><div style={{ fontSize: '13px', fontWeight: 600 }}>📡 {parsed.gigRadarScore}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Experience</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.experienceLevel}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Duration</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.duration}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Country</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.clientCountry}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Spent</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.totalSpent}</div></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="job-list-col reject-col">
                        <div className="col-header reject">
                            <ThumbsDown size={18} className="icon-reject" />
                            <h3>Rejected Leads ({rejections.length})</h3>
                        </div>
                        <div className="job-cards-scroll">
                            {rejections.length === 0 && <div className="empty-list">No rejections synced yet.</div>}
                            {rejections.map(job => {
                                const parsed = parseGigRadarText(job.rawText);
                                const isExpanded = expandedId === job.id;
                                return (
                                    <div key={job.id} className="job-card glass-panel" style={{ cursor: 'pointer', transition: 'all 0.2s', padding: isExpanded ? '20px' : '16px' }} onClick={(e) => toggleExpand(job.id, e)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', lineHeight: 1.4, fontSize: '14px' }}>{parsed.title || job.title}</h4>
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>

                                        {job.booleanSearch && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                <strong>Query:</strong> {job.booleanSearch}
                                            </div>
                                        )}

                                        {!isExpanded && (
                                            <p className="job-preview" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {parsed.description || job.rawText}
                                            </p>
                                        )}

                                        {isExpanded && (
                                            <div className="expanded-card-content fade-in" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                                                    {parsed.description}
                                                </div>

                                                {parsed.skills && parsed.skills.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                                        {parsed.skills.map((s, i) => <span key={i} style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{s}</span>)}
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.budget}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GigRadar Score</div><div style={{ fontSize: '13px', fontWeight: 600 }}>📡 {parsed.gigRadarScore}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Experience</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.experienceLevel}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Duration</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.duration}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Country</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.clientCountry}</div></div>
                                                    <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Spent</div><div style={{ fontSize: '13px', fontWeight: 600 }}>{parsed.totalSpent}</div></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
