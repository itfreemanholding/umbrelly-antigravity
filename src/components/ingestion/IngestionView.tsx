import React, { useState, useEffect } from 'react';
import { 
    FileText, Database, ArrowRight, CheckCircle2, MessageSquare, 
    Video, Globe, Share2, Users, MonitorPlay, Search, Newspaper 
} from 'lucide-react';
import { parseGigRadarText } from '../../utils/parser';
import type { ParsedJob } from '../../utils/parser';
import './IngestionView.css';

interface IngestionViewProps {
    onSubmit: (job: ParsedJob) => void;
    onNavigateToData?: () => void;
}

const DATA_TYPES = {
    INTERNAL: [
        { id: 'Gigradar', label: 'Gigradar / Upwork', icon: Database, desc: 'Paste raw job descriptions with Gigradar metadata.' },
        { id: 'Quote', label: 'Direct Quote', icon: FileText, desc: 'Paste a specific sentence or direct feedback from a client.' },
        { id: 'PNF Reply', label: 'PNF Reply', icon: MessageSquare, desc: 'Positive, Neutral, or Forwarding replies from email outreach.' },
        { id: 'Call Recording', label: 'Call Recording', icon: Video, desc: 'Sales or Demo calls transcripts and video links.' }
    ],
    COMPETITOR: [
        { id: 'Competitor Website', label: 'Competitor Website', icon: Globe, desc: 'Dump scraped text from competitor landing pages.' },
        { id: 'Social Media', label: 'Social Media (SMM)', icon: Share2, desc: 'Organic social media posts from branded competitor accounts.' },
        { id: 'LinkedIn Employees', label: 'LinkedIn Employees', icon: Users, desc: 'Posts or profile text from key executives/employees.' },
        { id: 'Paid Ads', label: 'Paid Ads', icon: MonitorPlay, desc: 'Ad copy and imagery transcriptions from FB/Meta/Google.' },
        { id: 'SEO/AEO', label: 'SEO & AEO Content', icon: Search, desc: 'Blog posts or programmatic SEO pages from competitors.' },
        { id: 'PR & Media', label: 'PR & Media', icon: Newspaper, desc: 'Press releases, news articles, or podcast transcripts.' }
    ]
};

export function IngestionView({ onSubmit, onNavigateToData }: IngestionViewProps) {
    const [activeType, setActiveType] = useState('Gigradar');
    const [content, setContent] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [competitorName, setCompetitorName] = useState('');
    const [memo, setMemo] = useState('');
    const [matchScore, setMatchScore] = useState(10);
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

    // Find the current active type config for UI rendering
    const activeConfig = [...DATA_TYPES.INTERNAL, ...DATA_TYPES.COMPETITOR].find(t => t.id === activeType) || DATA_TYPES.INTERNAL[0];
    const ActiveIcon = activeConfig.icon;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() || urlInput.trim()) {
            
            // Reconstruct the raw text intelligently if there is an associated URL
            const finalPayloadText = urlInput.trim() ? `Source URL: ${urlInput}\n\n${content}` : content;

            const baseJob: Partial<ParsedJob> = {
                id: Date.now().toString(),
                matchScore,
                memo,
                booleanSearch,
                dateIngested: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                budget: '-',
                duration: '-',
                totalSpent: '-',
                clientCountry: competitorName.trim() ? competitorName : '-',
                title: competitorName.trim() ? `${competitorName} - ${activeType}` : `${activeType} Ingestion`,
                description: finalPayloadText.length > 150 ? finalPayloadText.substring(0, 150) + '...' : finalPayloadText,
                rawText: finalPayloadText,
                dataType: activeType
            };

            let finalJob: ParsedJob;

            if (activeType === 'Gigradar') {
                const parsed = parseGigRadarText(content);
                finalJob = { ...(baseJob as ParsedJob), ...parsed, dataType: activeType };
            } else {
                finalJob = baseJob as ParsedJob;
            }

            onSubmit(finalJob);

            setShowSuccess(true);
            setContent('');
            setUrlInput('');
            setCompetitorName('');
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
                        <p>{activeType} record has been categorized and saved.</p>
                    </div>
                    {onNavigateToData && (
                        <button onClick={onNavigateToData} className="toast-action">
                            View Data Hub
                        </button>
                    )}
                </div>
            )}

            <div className="ingestion-container fade-in-up">
                <div className="ingestion-header">
                    <h1 className="text-gradient">Ingest Intelligence Engine</h1>
                    <p className="subtitle">Feed the RevOps engine with customer inputs, call transcripts, and competitor marketing data.</p>
                </div>

                <div className="ingestion-layout">
                    {/* Left Sidebar Category Switcher */}
                    <div className="ingestion-sidebar">
                        <div className="sidebar-category">
                            <h4 className="category-title">Internal Data</h4>
                            {DATA_TYPES.INTERNAL.map(type => {
                                const Icon = type.icon;
                                return (
                                    <button 
                                        key={type.id}
                                        className={`type-btn ${activeType === type.id ? 'active' : ''}`}
                                        onClick={() => { setActiveType(type.id); setContent(''); setUrlInput(''); setCompetitorName(''); }}
                                        type="button"
                                    >
                                        <Icon size={16} />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="sidebar-category">
                            <h4 className="category-title">Competitor Intelligence</h4>
                            {DATA_TYPES.COMPETITOR.map(type => {
                                const Icon = type.icon;
                                return (
                                    <button 
                                        key={type.id}
                                        className={`type-btn ${activeType === type.id ? 'active' : ''}`}
                                        onClick={() => { setActiveType(type.id); setContent(''); setUrlInput(''); setCompetitorName(''); }}
                                        type="button"
                                    >
                                        <Icon size={16} />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Pane Form */}
                    <div className="ingestion-panel">
                        <div className="form-header">
                            <h3><ActiveIcon size={20} color="var(--accent-primary)" /> New {activeConfig.label}</h3>
                            <p>{activeConfig.desc}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="ingestion-form">
                            
                            {/* Conditional Competitor Name Input */}
                            {['Competitor Website', 'Social Media', 'LinkedIn Employees', 'Paid Ads', 'SEO/AEO', 'PR & Media'].includes(activeType) && (
                                <div className="input-group">
                                    <label>Competitor Brand / Name</label>
                                    <input 
                                        type="text" 
                                        className="input-area" 
                                        style={{height: '42px'}}
                                        placeholder="e.g., Stripe, HubSpot"
                                        value={competitorName}
                                        onChange={(e) => setCompetitorName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {/* Conditional URL Input */}
                            {['Call Recording', 'Competitor Website', 'Social Media', 'Paid Ads', 'SEO/AEO', 'PR & Media'].includes(activeType) && (
                                <div className="input-group">
                                    <label>Source URL (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="input-area" 
                                        style={{height: '42px'}}
                                        placeholder="e.g., https://youtube.com/... or https://competitor.com/pricing"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label>
                                    {activeType === 'Gigradar' ? 'Paste Gigradar Job Description' : 
                                     activeType === 'Call Recording' ? 'Paste Call Transcript / Notes' :
                                     activeType === 'PNF Reply' ? 'Paste Email Thread / Reply' :
                                     'Paste Text Content'}
                                </label>
                                <textarea
                                    className="input-area"
                                    placeholder={activeType === 'Gigradar' ? "e.g. AWS cost optimisation audit..." : "Paste the raw text data here to be analyzed..."}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={8}
                                />
                            </div>

                            <div className="input-group" style={{ marginTop: '12px', marginBottom: '8px' }}>
                                <label>Analysis Context / Memo (Optional)</label>
                                <textarea
                                    className="input-area"
                                    style={{ minHeight: '60px' }}
                                    placeholder={activeType === 'Gigradar' ? "Why is this a 10/10? Any specific observations?" : "Add any specific context the AI should know before crafting marketing materials from this."}
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Gigradar specific metadata fields */}
                            {activeType === 'Gigradar' && (
                                <div className="input-row" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                    <div className="input-group flex-1" style={{ flex: 1 }}>
                                        <label>Initial Match Score</label>
                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={matchScore}
                                                onChange={(e) => setMatchScore(parseInt(e.target.value))}
                                                style={{ flex: 1, WebkitAppearance: 'none', appearance: 'none', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}
                                            />
                                            <span className={`rating-badge small ${matchScore >= 8 ? 'high' : matchScore >= 5 ? 'med' : 'low'}`} style={{ marginLeft: '12px' }}>
                                                {matchScore}/10
                                            </span>
                                        </div>
                                    </div>
                                    <div className="input-group flex-1" style={{ flex: 1 }}>
                                        <label>GigRadar Boolean Used</label>
                                        <input
                                            type="text"
                                            className="input-area"
                                            style={{ height: '42px' }}
                                            placeholder="e.g. (AWS | Amazon)"
                                            value={booleanSearch}
                                            onChange={(e) => setBooleanSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="primary-btn pulse-glow"
                                    disabled={!content.trim() && !urlInput.trim()}
                                >
                                    Ingest & Analyze Intelligence
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
