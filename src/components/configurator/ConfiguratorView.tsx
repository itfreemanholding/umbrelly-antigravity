import React, { useState } from 'react';
import { Settings, ThumbsUp, ThumbsDown, Zap, ChevronDown, ChevronUp, Trash2, Info } from 'lucide-react';
import { HighlightedText } from '../ui/HighlightedText';
import { parseGigRadarText } from '../../utils/parser';
import { runPatternEngine, type GeneratedBoolean } from '../../utils/patternEngine';
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

export function ConfiguratorView({ approvedJobs = [], onDeleteJob }: { approvedJobs?: any[], onDeleteJob?: (id: string) => void }) {
    const [scannedJobs, setScannedJobs] = useState<ScannedJob[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedBooleans, setGeneratedBooleans] = useState<GeneratedBoolean[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setScannedJobs(prev => prev.filter(j => j.id !== id));
        if (onDeleteJob) {
            onDeleteJob(id);
        }
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

    const matches = approvedJobs.length > 0 ? approvedJobs : scannedJobs.filter(j => j.isMatch);
    const rejections = scannedJobs.filter(j => !j.isMatch);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setGeneratedBooleans([]);

        // Simulate AI analysis delay
        setTimeout(() => {
            setIsAnalyzing(false);
            const results = runPatternEngine(matches, rejections);
            setGeneratedBooleans(results);
        }, 2000);
    };

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

                    {generatedBooleans.length > 0 && !isAnalyzing && (
                        <div className="generated-results fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <h4 style={{ color: 'var(--accent-primary)', margin: 0, fontSize: '15px' }}>Optimized GigRadar Booleans:</h4>

                            {generatedBooleans.map((gb, idx) => (
                                <div key={idx} className="glass-panel stagger-1" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', animationDelay: `${idx * 0.15}s` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Strategy Option {idx + 1}</div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                            <span style={{ color: 'var(--success)' }}>
                                                Includes Matches: <strong style={{ marginLeft: '4px' }}>{gb.matchesIncluded}/{gb.matchesTotal}</strong>
                                            </span>
                                            <span style={{ color: 'var(--danger)' }}>
                                                Excludes Rejections: <strong style={{ marginLeft: '4px' }}>{gb.rejectionsExcluded}/{gb.rejectionsTotal}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="boolean-code-block" style={{ margin: 0, background: 'var(--bg-primary)' }}>
                                        <code style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{gb.query}</code>
                                    </div>
                                </div>
                            ))}
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
                                            <h4 style={{ margin: '0 0 8px 0', lineHeight: 1.4, fontSize: '14px' }}>
                                                <HighlightedText text={parsed.title || job.title} booleanQuery={job.booleanSearch} />
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
                                                <button onClick={(e) => handleDelete(e, job.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }} title="Delete Job" className="danger-hover icon-btn">
                                                    <Trash2 size={16} />
                                                </button>
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
                                            <div className="expanded-content fade-in" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                                <div className="raw-text-block" style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px', background: 'transparent', padding: 0, border: 'none' }}>
                                                    {(parsed.description || '').split('\n').map((line: string, i: number) => (
                                                        <p key={i} style={{ marginBottom: line.trim() === '' ? '0' : '12px', minHeight: line.trim() === '' ? '12px' : 'auto', marginTop: 0 }}>
                                                            <HighlightedText text={line} booleanQuery={job.booleanSearch} />
                                                        </p>
                                                    ))}
                                                </div>

                                                {parsed.skills && parsed.skills.length > 0 && (
                                                    <div className="skills-container" style={{ marginBottom: '16px' }}>
                                                        {parsed.skills.map((skill: string, idx: number) => (
                                                            <span key={idx} className="skill-tag-bordered">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="metrics-horizontal-grid">
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">📡 {parsed.gigRadarScore || '-'} <Info size={12} style={{ color: 'var(--text-muted)' }} /></span>
                                                        <span className="metric-box-label">GigRadar Score</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.paymentType === 'Hourly' ? '-' : (parsed.budget && parsed.budget !== '-' ? parsed.budget : '-')}</span>
                                                        <span className="metric-box-label">{parsed.paymentType || 'Budget'}</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.talentPreference || '-'}</span>
                                                        <span className="metric-box-label">Talent Preference</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.experienceLevel || '-'}</span>
                                                        <span className="metric-box-label">Experience Level</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.hourlyLoad || '-'}</span>
                                                        <span className="metric-box-label">Hourly Load</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.duration || '-'}</span>
                                                        <span className="metric-box-label">Duration</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.clientCountry === '-' ? '-' : parsed.clientCountry}</span>
                                                        <span className="metric-box-label">Country</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.totalSpent || '-'}</span>
                                                        <span className="metric-box-label">Total Spent</span>
                                                    </div>

                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.avgRatePaid || '-'}</span>
                                                        <span className="metric-box-label">Avg Rate Paid</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.companySize || '-'}</span>
                                                        <span className="metric-box-label">Company Size</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.paymentVerified ? 'Verified' : 'Unverified'}</span>
                                                        <span className="metric-box-label">Payment Verified</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.memberSince || '-'}</span>
                                                        <span className="metric-box-label">Member Since</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">⭐️ {parsed.clientFeedback && parsed.clientFeedback !== '-' ? parsed.clientFeedback : '-'}</span>
                                                        <span className="metric-box-label">Client Feedback</span>
                                                    </div>
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
                                            <h4 style={{ margin: '0 0 8px 0', lineHeight: 1.4, fontSize: '14px' }}>
                                                <HighlightedText text={parsed.title || job.title} booleanQuery={job.booleanSearch} />
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
                                                <button onClick={(e) => handleDelete(e, job.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }} title="Delete Job" className="danger-hover icon-btn">
                                                    <Trash2 size={16} />
                                                </button>
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
                                            <div className="expanded-content fade-in" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                                <div className="raw-text-block" style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px', background: 'transparent', padding: 0, border: 'none' }}>
                                                    {(parsed.description || '').split('\n').map((line: string, i: number) => (
                                                        <p key={i} style={{ marginBottom: line.trim() === '' ? '0' : '12px', minHeight: line.trim() === '' ? '12px' : 'auto', marginTop: 0 }}>
                                                            <HighlightedText text={line} booleanQuery={job.booleanSearch} />
                                                        </p>
                                                    ))}
                                                </div>

                                                {parsed.skills && parsed.skills.length > 0 && (
                                                    <div className="skills-container" style={{ marginBottom: '16px' }}>
                                                        {parsed.skills.map((skill: string, idx: number) => (
                                                            <span key={idx} className="skill-tag-bordered">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="metrics-horizontal-grid">
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">📡 {parsed.gigRadarScore || '-'} <Info size={12} style={{ color: 'var(--text-muted)' }} /></span>
                                                        <span className="metric-box-label">GigRadar Score</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.paymentType === 'Hourly' ? '-' : (parsed.budget && parsed.budget !== '-' ? parsed.budget : '-')}</span>
                                                        <span className="metric-box-label">{parsed.paymentType || 'Budget'}</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.talentPreference || '-'}</span>
                                                        <span className="metric-box-label">Talent Preference</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.experienceLevel || '-'}</span>
                                                        <span className="metric-box-label">Experience Level</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.hourlyLoad || '-'}</span>
                                                        <span className="metric-box-label">Hourly Load</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.duration || '-'}</span>
                                                        <span className="metric-box-label">Duration</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.clientCountry === '-' ? '-' : parsed.clientCountry}</span>
                                                        <span className="metric-box-label">Country</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.totalSpent || '-'}</span>
                                                        <span className="metric-box-label">Total Spent</span>
                                                    </div>

                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.avgRatePaid || '-'}</span>
                                                        <span className="metric-box-label">Avg Rate Paid</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.companySize || '-'}</span>
                                                        <span className="metric-box-label">Company Size</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.paymentVerified ? 'Verified' : 'Unverified'}</span>
                                                        <span className="metric-box-label">Payment Verified</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">{parsed.memberSince || '-'}</span>
                                                        <span className="metric-box-label">Member Since</span>
                                                    </div>
                                                    <div className="metric-box">
                                                        <span className="metric-box-value">⭐️ {parsed.clientFeedback && parsed.clientFeedback !== '-' ? parsed.clientFeedback : '-'}</span>
                                                        <span className="metric-box-label">Client Feedback</span>
                                                    </div>
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
