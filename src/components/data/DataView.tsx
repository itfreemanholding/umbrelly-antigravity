import React, { useState, useMemo } from 'react';
import { Search, Database, ArrowUpDown, Filter, ChevronDown, ChevronUp, Trash2, Edit2, Check, X, Info } from 'lucide-react';
import type { ParsedJob } from '../../utils/parser';
import './DataView.css';

interface DataViewProps {
    jobs: ParsedJob[];
    onDeleteJob: (id: string) => void;
    onUpdateJob: (job: ParsedJob) => void;
}

function parseBooleanQuery(query: string) {
    const terms: { term: string, isWildcard: boolean }[] = [];
    const quotedRegex = /"([^"]+)"/g;
    let match;
    let raw = query;
    while ((match = quotedRegex.exec(query)) !== null) {
        terms.push({ term: match[1], isWildcard: false });
        raw = raw.replace(match[0], ' ');
    }
    const words = raw.replace(/[()|]/g, ' ').split(/\s+/).filter(w => w.length > 0 && w.toUpperCase() !== 'AND' && w.toUpperCase() !== 'OR' && w.toUpperCase() !== 'NOT');
    for (const word of words) {
        if (word.endsWith('*')) {
            terms.push({ term: word.slice(0, -1), isWildcard: true });
        } else {
            terms.push({ term: word, isWildcard: false });
        }
    }
    return terms;
}

function HighlightedText({ text, booleanQuery }: { text: string, booleanQuery?: string }) {
    if (!booleanQuery) return <>{text}</>;

    const terms = parseBooleanQuery(booleanQuery).sort((a, b) => b.term.length - a.term.length);
    if (terms.length === 0) return <>{text}</>;

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regexParts = terms.map(t => {
        if (t.isWildcard) {
            return `\\b${escapeRegExp(t.term)}\\w*`;
        } else {
            return `\\b${escapeRegExp(t.term)}\\b`;
        }
    });
    const regex = new RegExp(`(${regexParts.join('|')})`, 'gi');

    const chunks = text.split(regex);

    return (
        <React.Fragment>
            {chunks.map((chunk, i) => {
                if (!chunk) return null;
                if (chunk.match(new RegExp(`^${regex.source}$`, 'i'))) {
                    return <span key={i} style={{ backgroundColor: '#FFEB3B', color: '#000', fontWeight: '500', borderRadius: '2px', padding: '0 2px' }}>{chunk}</span>;
                }
                return chunk;
            })}
        </React.Fragment>
    );
}

const CloudLogo = ({ tag }: { tag: string }) => {
    if (tag === 'AWS') return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" height="14" alt="AWS" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
    if (tag === 'Azure') return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg" height="14" alt="Azure" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
    if (tag === 'GCP') return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg" height="14" alt="GCP" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
    return null;
}

export function DataView({ jobs, onDeleteJob, onUpdateJob }: DataViewProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: 'score' | 'date', direction: 'asc' | 'desc' } | null>(null);

    // Inline Edit State
    const [editingBooleanId, setEditingBooleanId] = useState<string | null>(null);
    const [editBooleanValue, setEditBooleanValue] = useState("");
    const [showToast, setShowToast] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleSort = (key: 'score' | 'date') => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDeleteJob(id);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const startEditBoolean = (e: React.MouseEvent, job: ParsedJob) => {
        e.stopPropagation();
        setEditingBooleanId(job.id);
        setEditBooleanValue(job.booleanSearch || "");
    }

    const saveBoolean = (e: React.MouseEvent, job: ParsedJob) => {
        e.stopPropagation();
        onUpdateJob({ ...job, booleanSearch: editBooleanValue });
        setEditingBooleanId(null);
    }

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingBooleanId(null);
    }

    const filteredAndSortedJobs = useMemo(() => {
        let result = jobs;

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(job =>
                job.title.toLowerCase().includes(lowerSearch) ||
                job.description.toLowerCase().includes(lowerSearch) ||
                (job.cloudTag && job.cloudTag.toLowerCase().includes(lowerSearch))
            );
        }

        if (sortConfig) {
            result = [...result].sort((a, b) => {
                if (sortConfig.key === 'score') {
                    return sortConfig.direction === 'asc'
                        ? a.matchScore - b.matchScore
                        : b.matchScore - a.matchScore;
                } else {
                    // Simple string compare for dates since they might be "Just now" or formatted strings
                    return sortConfig.direction === 'asc'
                        ? a.dateIngested.localeCompare(b.dateIngested)
                        : b.dateIngested.localeCompare(a.dateIngested);
                }
            });
        }

        return result;
    }, [jobs, searchTerm, sortConfig]);

    return (
        <div className="data-container fade-in-up">
            <div className="data-header">
                <div>
                    <h1 className="text-gradient">Data Hub</h1>
                    <p className="subtitle">Historical log of all ingested jobs and matched profiles.</p>
                </div>

                <div className="data-actions">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search saved jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="secondary-btn">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="glass-panel panel-content data-table-panel">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Job Title</th>
                                <th onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Score <ArrowUpDown size={14} /></div>
                                </th>
                                <th>Budget & Rate</th>
                                <th>Country</th>
                                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Date <ArrowUpDown size={14} /></div>
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-state-row">
                                        <div className="empty-state">
                                            <Database size={32} color="var(--text-muted)" />
                                            <p>No data ingested yet. Go to Ingestion to parse a new job!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedJobs.map(job => (
                                    <React.Fragment key={job.id}>
                                        <tr
                                            className={`stagger-1 clickable-row ${expandedId === job.id ? 'expanded-active' : ''}`}
                                            onClick={() => toggleExpand(job.id)}
                                        >
                                            <td className="col-title">
                                                <div className="job-title-truncate" title={job.title}>
                                                    <HighlightedText text={job.title} booleanQuery={job.booleanSearch} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                                                    {job.cloudTag && job.cloudTag !== 'Other' && (
                                                        <span className="skill-badge" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px' }}>
                                                            <CloudLogo tag={job.cloudTag} /> {job.cloudTag}
                                                        </span>
                                                    )}

                                                    {editingBooleanId === job.id ? (
                                                        <div className="boolean-edit-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editBooleanValue}
                                                                onChange={e => setEditBooleanValue(e.target.value)}
                                                                placeholder="Enter boolean tag..."
                                                                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                                                                autoFocus
                                                                onKeyDown={e => e.key === 'Enter' && saveBoolean(e as any, job)}
                                                            />
                                                            <button onClick={(e) => saveBoolean(e, job)} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '2px', display: 'flex' }}><Check size={14} /></button>
                                                            <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', display: 'flex' }}><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="skill-badge"
                                                            style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: job.booleanSearch ? 'var(--bg-secondary)' : 'transparent', border: job.booleanSearch ? '1px solid transparent' : '1px dashed var(--border-color)', color: job.booleanSearch ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer' }}
                                                            onClick={(e) => startEditBoolean(e, job)}
                                                            title="Edit Boolean Search Tag"
                                                        >
                                                            {job.booleanSearch || "+ Add Boolean"} <Edit2 size={10} style={{ marginLeft: '4px', opacity: 0.5 }} />
                                                        </span>
                                                    )}
                                                </div>
                                                {job.memo && <div className="job-memo" style={{ marginTop: '4px' }}>Memo: {job.memo}</div>}
                                            </td>
                                            <td className="col-score">
                                                <span className={`rating-badge small ${job.matchScore >= 8 ? 'high' : job.matchScore >= 5 ? 'med' : 'low'}`}>
                                                    {job.matchScore}/10
                                                </span>
                                            </td>
                                            <td className="col-budget">
                                                <div className="metric-text" style={{ fontSize: '14px', fontWeight: 500 }}>{job.paymentType || 'Not specified'}</div>
                                                <div className="text-muted text-xs">{job.budget && job.budget !== '-' ? job.budget : 'Not mentioned'}</div>
                                            </td>
                                            <td className="col-client">
                                                <div className="metric-text" style={{ fontSize: '18px' }} title={job.clientCountry}>
                                                    {job.clientCountry} {job.paymentVerified && <span style={{ fontSize: '12px', color: 'var(--success)' }}>✓</span>}
                                                </div>
                                            </td>
                                            <td className="col-date">
                                                <div className="metric-text">
                                                    {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(job.dateIngested))}
                                                </div>
                                                <div className="text-muted text-xs">{job.postedTimeAgo !== 'Just now' ? job.postedTimeAgo : ''}</div>
                                            </td>
                                            <td className="col-actions">
                                                <div className="date-action-cell">
                                                    <button
                                                        onClick={(e) => handleDelete(e, job.id)}
                                                        className="icon-btn danger-hover"
                                                        title="Delete Job"
                                                        style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {expandedId === job.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === job.id && (
                                            <tr className="expanded-detail-row">
                                                <td colSpan={6}>
                                                    <div className="expanded-content fade-in" style={{ padding: '24px 32px' }}>
                                                        <div className="raw-text-block" style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px', background: 'transparent', padding: 0, border: 'none' }}>
                                                            {job.description.split('\n').map((line, i) => (
                                                                <p key={i} style={{ marginBottom: line.trim() === '' ? '0' : '12px', minHeight: line.trim() === '' ? '12px' : 'auto' }}>
                                                                    <HighlightedText text={line} booleanQuery={job.booleanSearch} />
                                                                </p>
                                                            ))}
                                                        </div>

                                                        {job.skills && job.skills.length > 0 && (
                                                            <div className="skills-container">
                                                                {job.skills.map((skill, idx) => (
                                                                    <span key={idx} className="skill-tag-bordered">{skill}</span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="metrics-horizontal-grid">
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">📡 {job.gigRadarScore || '-'} <Info size={12} style={{ color: 'var(--text-muted)' }} /></span>
                                                                <span className="metric-box-label">GigRadar Score</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.paymentType === 'Hourly' ? '-' : (job.budget && job.budget !== '-' ? job.budget : '-')}</span>
                                                                <span className="metric-box-label">{job.paymentType || 'Budget'}</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.talentPreference || '-'}</span>
                                                                <span className="metric-box-label">Talent Preference</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.experienceLevel || '-'}</span>
                                                                <span className="metric-box-label">Experience Level</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.hourlyLoad || '-'}</span>
                                                                <span className="metric-box-label">Hourly Load</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.duration || '-'}</span>
                                                                <span className="metric-box-label">Duration</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.clientCountry === '-' ? '-' : job.clientCountry}</span>
                                                                <span className="metric-box-label">Country</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.totalSpent || '-'}</span>
                                                                <span className="metric-box-label">Total Spent</span>
                                                            </div>

                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.avgRatePaid || '-'}</span>
                                                                <span className="metric-box-label">Avg Rate Paid</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.companySize || '-'}</span>
                                                                <span className="metric-box-label">Company Size</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.paymentVerified ? 'Verified' : 'Unverified'}</span>
                                                                <span className="metric-box-label">Payment Verified</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">{job.memberSince || '-'}</span>
                                                                <span className="metric-box-label">Member Since</span>
                                                            </div>
                                                            <div className="metric-box">
                                                                <span className="metric-box-value">⭐️ {job.clientFeedback && job.clientFeedback !== '-' ? job.clientFeedback : '-'}</span>
                                                                <span className="metric-box-label">Client Feedback</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showToast && (
                <div className="toast-notification fade-in" style={{ position: 'fixed', top: '24px', right: '24px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={16} color="var(--danger)" />
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>Job deleted successfully</span>
                </div>
            )}
        </div>
    );
}
