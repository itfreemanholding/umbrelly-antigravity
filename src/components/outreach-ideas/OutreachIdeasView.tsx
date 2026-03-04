import React, { useState } from 'react';
import { Send, Copy, Trash2, Calendar, Check, MessageSquare } from 'lucide-react';

export interface SavedOutreachIdea {
    id: string;
    strategy: string;
    customPrompt: string;
    generatedText: string;
    dateSaved: string;
}

interface OutreachIdeasViewProps {
    ideas: SavedOutreachIdea[];
    onDeleteIdea: (id: string) => void;
}

export const OutreachIdeasView: React.FC<OutreachIdeasViewProps> = ({ ideas, onDeleteIdea }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="outreach-ideas-view" style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Send className="text-accent" size={28} />
                        Outreach Ideas History
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                        A permanent library of all your AI-generated outreach sequences. Review, copy, or delete past generations.
                    </p>
                </div>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                }}>
                    {ideas.length} Saved {ideas.length === 1 ? 'Sequence' : 'Sequences'}
                </div>
            </div>

            {ideas.length === 0 ? (
                <div className="glass-panel" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '32px',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px auto'
                    }}>
                        <MessageSquare size={32} className="text-accent" style={{ opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Sequences Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        Head over to the Outreach Gen tab to synthesize your first batch of cold emails and LinkedIn messages.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                    {ideas.map((idea) => (
                        <div key={idea.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', borderTop: '4px solid var(--accent-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', textTransform: 'capitalize' }}>
                                        {idea.strategy} Strategy
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        <Calendar size={14} />
                                        <span>{formatDate(idea.dateSaved)}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleCopy(idea.id, idea.generatedText)}
                                        className="icon-btn"
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: copiedId === idea.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', color: copiedId === idea.id ? 'var(--success-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                        title={copiedId === idea.id ? "Copied!" : "Copy Sequence"}
                                    >
                                        {copiedId === idea.id ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                    <button
                                        onClick={() => onDeleteIdea(idea.id)}
                                        className="icon-btn delete-hover"
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                        title="Delete Sequence"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {idea.customPrompt && (
                                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--accent-secondary)' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CUSTOM INSTRUCTIONS</span>
                                    <p style={{ fontSize: '14px', margin: 0, fontStyle: 'italic', color: 'var(--text-primary)' }}>"{idea.customPrompt}"</p>
                                </div>
                            )}

                            <div style={{
                                flex: 1,
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                padding: '16px',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                color: 'var(--text-primary)',
                                whiteSpace: 'pre-wrap',
                                overflowY: 'auto',
                                maxHeight: '400px',
                                border: '1px solid var(--border-color)'
                            }}>
                                {idea.generatedText}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
