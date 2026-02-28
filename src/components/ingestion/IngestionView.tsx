import { useState } from 'react';
import { FileText, Link as LinkIcon, Upload, ArrowRight } from 'lucide-react';
import './IngestionView.css';

interface IngestionViewProps {
    onSubmit: (data: any) => void;
}

export function IngestionView({ onSubmit }: IngestionViewProps) {
    const [activeTab, setActiveTab] = useState<'text' | 'url' | 'upload'>('text');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onSubmit({ type: activeTab, content });
        }
    };

    return (
        <div className="ingestion-container fade-in-up">
            <div className="ingestion-header">
                <h1 className="text-gradient">Ingest Customer Data</h1>
                <p className="subtitle">Feed the RevOps engine with Upwork posts, demo transcripts, or direct quotes.</p>
            </div>

            <div className="glass-panel ingestion-panel">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'text' ? 'active' : ''}`}
                        onClick={() => setActiveTab('text')}
                    >
                        <FileText size={18} />
                        Raw Text / Quotes
                    </button>
                    <button
                        className={`tab ${activeTab === 'url' ? 'active' : ''}`}
                        onClick={() => setActiveTab('url')}
                    >
                        <LinkIcon size={18} />
                        Upwork URL
                    </button>
                    <button
                        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload size={18} />
                        Media Upload (Coming Soon)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="ingestion-form">
                    {activeTab === 'text' && (
                        <div className="input-group">
                            <label>Paste Job Description or Quotes</label>
                            <textarea
                                className="input-area"
                                placeholder="e.g. AWS cost optimisation audit and implementation for SaaS platform..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                            />
                        </div>
                    )}

                    {activeTab === 'url' && (
                        <div className="input-group">
                            <label>Upwork Job URL</label>
                            <input
                                type="url"
                                className="input-base"
                                placeholder="https://www.upwork.com/jobs/..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="upload-area">
                            <Upload size={48} color="var(--text-muted)" />
                            <p>Drag and drop Demo recordings or PDF transcripts here.</p>
                            <span className="upload-soon">Video & Audio Processing Coming Soon</span>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="primary-btn pulse-glow"
                            disabled={!content.trim() && activeTab !== 'upload'}
                        >
                            Analyze Needs & Generate Assets
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
