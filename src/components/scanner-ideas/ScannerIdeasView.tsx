import React from 'react';
import { Lightbulb, Copy, Trash2, Check } from 'lucide-react';

export interface SavedIdea {
    id: string;
    query: string;
    matchesIncluded: number;
    matchesTotal: number;
    rejectionsExcluded: number;
    rejectionsTotal: number;
    dateSaved: string;
}

interface ScannerIdeasViewProps {
    ideas: SavedIdea[];
    onDeleteIdea: (id: string) => void;
}

export function ScannerIdeasView({ ideas = [], onDeleteIdea }: ScannerIdeasViewProps) {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="data-view-container fade-in">
            <div className="view-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="logo-icon pulse-glow">
                        <Lightbulb size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)' }}>Scanner Ideas</h2>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px' }}>
                            View and manage your saved boolean strategies
                        </p>
                    </div>
                </div>
            </div>

            {ideas.length === 0 ? (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <Lightbulb size={48} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} />
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No ideas saved yet</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '400px' }}>
                        Generate winning boolean searches using the Pattern Analysis Engine on the Configuring Scanners page and save them here for later.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '24px' }}>
                    {ideas.map((idea) => (
                        <div key={idea.id} className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '6px 16px', borderRadius: '20px' }}>
                                    <span style={{ color: idea.matchesIncluded === idea.matchesTotal ? 'var(--success)' : 'var(--text-secondary)' }}>
                                        Includes Matches: <strong style={{ marginLeft: '4px' }}>{idea.matchesIncluded}/{idea.matchesTotal}</strong>
                                    </span>
                                    <span style={{ color: idea.rejectionsExcluded === idea.rejectionsTotal ? 'var(--success)' : 'var(--danger)' }}>
                                        Excludes Rejections: <strong style={{ marginLeft: '4px' }}>{idea.rejectionsExcluded}/{idea.rejectionsTotal}</strong>
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        Saved: {new Date(idea.dateSaved).toLocaleDateString()}
                                    </span>
                                </div>
                                <button
                                    className="icon-btn danger"
                                    onClick={() => onDeleteIdea(idea.id)}
                                    title="Delete saved idea"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="boolean-code-block" style={{ margin: '0 0 16px 0', background: 'var(--bg-primary)' }}>
                                <code style={{ fontSize: '15px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{idea.query}</code>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className={`secondary-btn ${copiedId === idea.id ? 'success-btn' : ''}`}
                                    onClick={() => handleCopy(idea.id, idea.query)}
                                    style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {copiedId === idea.id ? (
                                        <>
                                            <Check size={16} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy Boolean
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
