import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Copy, Check, Database, Settings, X, Save } from 'lucide-react';
import { type ParsedJob, cleanJobText } from '../../utils/parser';

interface OutreachViewProps {
    approvedJobs: ParsedJob[];
    onIdeaGenerated?: (idea: any) => void;
}

const PROMPT_OPTIONS = [
    { id: 'direct', label: 'Direct Pitch', desc: 'Straight to the point value proposition highlighting ROI.' },
    { id: 'audit', label: 'Free Audit Offer', desc: 'Value-first approach offering a micro-consultation.' },
    { id: 'pain', label: 'Pain Point Agitation', desc: 'Emphasizes their specific struggles before offering a solution.' }
];

export const OutreachView: React.FC<OutreachViewProps> = ({ approvedJobs, onIdeaGenerated }) => {
    const [selectedOption, setSelectedOption] = useState<string>('pain');
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOutput, setGeneratedOutput] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState('');
    const [copied, setCopied] = useState(false);

    // New Modal state
    const [showContextModal, setShowContextModal] = useState(false);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [showRawPromptModal, setShowRawPromptModal] = useState(false);
    const [masterPrompt, setMasterPrompt] = useState('You are an expert B2B copywriter specializing in cold outreach. Your task is to analyze the provided job descriptions and generate a highly converting outreach sequence.');
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);

    // Load master prompt from settings on mount
    React.useEffect(() => {
        fetch('/api/settings/outreach_prompt')
            .then(res => res.json())
            .then(data => {
                if (data.value) setMasterPrompt(typeof data.value === 'string' ? data.value : String(data.value));
            })
            .catch(err => console.error("Failed to load prompt:", err));
    }, []);

    const saveMasterPrompt = async () => {
        setIsSavingPrompt(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'outreach_prompt', value: masterPrompt })
            });
            setShowPromptModal(false);
        } catch (err) {
            console.error("Failed to save prompt:", err);
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const getPreviewPrompt = () => {
        const jobContext = approvedJobs.map((j) => {
            return `[Intelligence Type: ${j.dataType || 'Gigradar / Upwork Job'}]\nSource/Title: ${j.title}\nContent Data:\n${cleanJobText(j.rawText)}`;
        }).join('\n\n---\n\n');

        let strategyContext = "";
        if (selectedOption === 'direct') strategyContext = "Use a Direct Pitch strategy: Get straight to the point highlighting the ROI and value proposition.";
        else if (selectedOption === 'audit') strategyContext = "Use a Free Audit Offer strategy: Take a value-first approach offering a micro-consultation or free audit.";
        else if (selectedOption === 'pain') strategyContext = "Use a Pain Point Agitation strategy: Emphasize their specific struggles found in the job descriptions before offering a solution.";

        return `Here are the job descriptions of our approved matches:\n\n${jobContext}\n\n${strategyContext}\n\n${customPrompt ? 'Additional Custom Instructions: ' + customPrompt + '\n\n' : ''}Generate the cold outreach sequence (Email 1, Email 2, Email 3, and a LinkedIn connection message). Use clear formatting.`;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setErrorMsg('');
        setGeneratedOutput('');

        try {
            const response = await fetch('/api/claude/outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobs: approvedJobs.map(j => ({ title: j.title, rawText: j.rawText })),
                    option: selectedOption,
                    customPrompt: customPrompt,
                    masterPrompt: masterPrompt
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to generate sequence');
            }

            const data = await response.json();
            setGeneratedOutput(data.result);
            if (data.id && onIdeaGenerated) {
                onIdeaGenerated({
                    id: data.id,
                    strategy: selectedOption,
                    customPrompt: customPrompt,
                    generatedText: data.result,
                    dateSaved: new Date().toISOString()
                });
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to generate sequence.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="outreach-view" style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Send className="text-accent" size={28} />
                        Outreach Sequence Generation
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                        Synthesize personalized cold outreach sequences by analyzing the specific pain points and language used across your <strong>{approvedJobs.length} Approved Matches</strong>.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowContextModal(true)}
                        className="glass-panel"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Database size={16} className="text-accent" />
                        Learning Data
                    </button>
                    <button
                        onClick={() => setShowPromptModal(true)}
                        className="glass-panel"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Settings size={16} className="text-accent" />
                        Master Prompt
                    </button>
                    <button
                        onClick={() => setShowRawPromptModal(true)}
                        className="glass-panel"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Sparkles size={16} />
                        View Exact AI Request
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>1. Select Sequence Strategy</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {PROMPT_OPTIONS.map(opt => (
                        <div
                            key={opt.id}
                            onClick={() => setSelectedOption(opt.id)}
                            style={{
                                padding: '16px',
                                borderRadius: '8px',
                                border: `2px solid ${selectedOption === opt.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                background: selectedOption === opt.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: selectedOption === opt.id ? 1 : 0.7
                            }}
                        >
                            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: selectedOption === opt.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                {opt.label}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {opt.desc}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>2. Custom Instructions (Optional)</h3>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Add specific details, tone adjustments, or call-to-action requirements..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {errorMsg && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px' }}>
                        {errorMsg}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || approvedJobs.length === 0}
                    className="primary-btn pulse-glow"
                    style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', justifyContent: 'center', gap: '8px' }}
                >
                    {isGenerating ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                    {isGenerating ? 'Analyzing Pain Points & Drafting Sequence...' : 'Generate Target Sequence'}
                </button>
            </div>

            {generatedOutput && (
                <div className="glass-panel" style={{ padding: '24px', position: 'relative', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Generated Outreach Sequence</h3>
                        <button
                            onClick={handleCopy}
                            className="secondary-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                            {copied ? 'Copied to Clipboard' : 'Copy Text'}
                        </button>
                    </div>

                    <div className="markdown-body" style={{
                        fontSize: '14px',
                        lineHeight: '1.7',
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {generatedOutput}
                    </div>
                </div>
            )}

            {/* Context Modal */}
            {showContextModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={20} className="text-accent" />
                                AI Learning Data Context
                            </h3>
                            <button onClick={() => setShowContextModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                This is the raw job description data currently being sent to Claude to learn your Ideal Customer Profile's language and pain points.
                            </p>
                            {approvedJobs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No approved matches available for learning.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {approvedJobs.map((job, idx) => (
                                        <div key={idx} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{job.title}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Approved Match ID: {job.id}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', opacity: 0.8, whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '4px' }}>
                                                {job.rawText ? cleanJobText(job.rawText) : 'No description available'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt Modal */}
            {showPromptModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '700px', display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} className="text-accent" />
                                Master System Prompt
                            </h3>
                            <button onClick={() => setShowPromptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Customize the core system instructions that guide Claude's persona and objective when generating sequences. This prompt is applied universally across all sequence strategies.
                            </p>
                            <textarea
                                value={masterPrompt}
                                onChange={(e) => setMasterPrompt(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '220px',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    resize: 'vertical',
                                    fontFamily: 'monospace',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                            />
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowPromptModal(false)} className="secondary-btn" style={{ padding: '8px 16px', fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button onClick={saveMasterPrompt} disabled={isSavingPrompt} className="primary-btn pulse-glow" style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isSavingPrompt ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                                Save Master Prompt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Request Transparency Modal */}
            {showRawPromptModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                <Sparkles size={20} className="text-accent" />
                                What Claude Sees
                            </h3>
                            <button onClick={() => setShowRawPromptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                                Here is the exact payload constructed from your settings and selected jobs. This gets sent directly to the AI model to generate the sequence.
                            </p>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    <Settings size={16} className="text-accent" />
                                    System Instructions
                                </div>
                                <div style={{ padding: '16px', background: 'var(--bg-primary)', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                    {masterPrompt}
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    <Database size={16} className="text-success" />
                                    Combined Prompt & Data Context
                                </div>
                                <div style={{ padding: '16px', background: 'var(--bg-primary)', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto' }}>
                                    {getPreviewPrompt()}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowRawPromptModal(false)} className="primary-btn pulse-glow" style={{ padding: '8px 24px', fontSize: '14px' }}>
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
