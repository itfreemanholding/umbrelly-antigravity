import React, { useState } from 'react';
import { KeyRound, Copy, Check, Plus, Trash2, X } from 'lucide-react';
import './KeywordsView.css';

export interface SavedKeyword {
    id: string;
    keyword: string;
    category: string;
    competition: string;
    useCases: string;
    dateSaved: string;
}

interface KeywordsViewProps {
    keywords: SavedKeyword[];
    onDelete: (id: string) => void;
    onAdd: (kw: Omit<SavedKeyword, 'id' | 'dateSaved'>) => void;
}

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
        case 'core': return 'var(--warning)';
        case 'technical': return 'var(--accent-primary)';
        case 'commercial': return 'var(--success)';
        case 'adjacent': return 'var(--warning)';
        case 'compliance': return 'var(--info)';
        case 'long-tail': return 'var(--accent-secondary)';
        default: return 'var(--text-secondary)';
    }
};

const getCompetitionColor = (competition: string) => {
    switch (competition.toLowerCase()) {
        case 'high': return 'var(--success)';
        case 'medium': return 'var(--warning)';
        case 'low': return 'var(--text-secondary)';
        default: return 'var(--text-primary)';
    }
};

export const KeywordsView: React.FC<KeywordsViewProps> = ({ keywords, onDelete, onAdd }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newKw, setNewKw] = useState({ keyword: '', category: 'General', competition: 'Low', useCases: '' });

    const handleCopy = (keyword: string, id: string) => {
        navigator.clipboard.writeText(keyword);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSaveNew = () => {
        if (!newKw.keyword.trim()) return;
        onAdd(newKw);
        setIsModalOpen(false);
        setNewKw({ keyword: '', category: 'General', competition: 'Low', useCases: '' });
    };

    return (
        <div className="keywords-view" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="keywords-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <KeyRound className="text-warning" size={28} />
                        Keywords
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Keywords for SEO, Google Ads, content, and scanner refinement.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="secondary-btn"
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--warning)',
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        background: 'rgba(245, 158, 11, 0.05)'
                    }}
                >
                    <Plus size={16} />
                    Add Keyword
                </button>
            </div>

            {keywords.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                    No keywords saved yet. Generate them from the Google Ads tab!
                </div>
            ) : (
                <div className="keywords-grid">
                    {keywords.map(kw => (
                        <div key={kw.id} className="keyword-card">
                            <div className="keyword-card-header">
                                <h3 className="keyword-title">{kw.keyword}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="keyword-copy-btn"
                                        onClick={() => handleCopy(kw.keyword, kw.id)}
                                        title="Copy Keyword"
                                    >
                                        {copiedId === kw.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                    </button>
                                    <button
                                        className="keyword-copy-btn"
                                        onClick={() => onDelete(kw.id)}
                                        title="Delete Keyword"
                                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="keyword-tags">
                                {kw.category && (
                                    <span
                                        className="keyword-tag"
                                        style={{
                                            color: getCategoryColor(kw.category),
                                            borderColor: `${getCategoryColor(kw.category)}33`,
                                            backgroundColor: `${getCategoryColor(kw.category)}11`
                                        }}
                                    >
                                        {kw.category}
                                    </span>
                                )}
                                {kw.competition && (
                                    <span
                                        className="keyword-tag"
                                        style={{
                                            color: getCompetitionColor(kw.competition),
                                            borderColor: `${getCompetitionColor(kw.competition)}33`,
                                            backgroundColor: `${getCompetitionColor(kw.competition)}11`
                                        }}
                                    >
                                        {kw.competition}
                                    </span>
                                )}
                            </div>

                            {kw.useCases && (
                                <div className="keyword-footer">
                                    {kw.useCases}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} className="text-warning" />
                                Add Keyword
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Keyword Phrase</label>
                                <input value={newKw.keyword} onChange={e => setNewKw({ ...newKw, keyword: e.target.value })} className="input-base" placeholder="e.g. data tokenization platform" autoFocus />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Category</label>
                                    <select value={newKw.category} onChange={e => setNewKw({ ...newKw, category: e.target.value })} className="input-base">
                                        <option value="General">General</option>
                                        <option value="Core">Core</option>
                                        <option value="Technical">Technical</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Adjacent">Adjacent</option>
                                        <option value="Compliance">Compliance</option>
                                        <option value="Long-tail">Long-tail</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Competition</label>
                                    <select value={newKw.competition} onChange={e => setNewKw({ ...newKw, competition: e.target.value })} className="input-base">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Use Cases</label>
                                <input value={newKw.useCases} onChange={e => setNewKw({ ...newKw, useCases: e.target.value })} className="input-base" placeholder="e.g. Google Ads, SEO, Content" />
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsModalOpen(false)} className="secondary-btn" style={{ padding: '8px 16px', fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button onClick={handleSaveNew} disabled={!newKw.keyword.trim()} className="primary-btn" style={{ padding: '8px 16px', fontSize: '14px' }}>
                                Save Keyword
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
