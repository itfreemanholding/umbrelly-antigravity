import React, { useState } from 'react';
import { Zap, Check, ExternalLink } from 'lucide-react';
import type { GeneratedBoolean } from '../../utils/patternEngine';
import type { ParsedJob } from '../../utils/parser';

import type { SavedIdea } from '../scanner-ideas/ScannerIdeasView';

interface PatternEngineUIProps {
    approvedJobs: ParsedJob[];
    scannedJobs: any[];
    testedStrategy: GeneratedBoolean | null;
    setTestedStrategy: (strategy: GeneratedBoolean | null) => void;
    onSaveIdea?: (idea: SavedIdea) => void;
}

export const PatternEngineUI: React.FC<PatternEngineUIProps> = ({
    approvedJobs,
    scannedJobs,
    testedStrategy,
    setTestedStrategy,
    onSaveIdea
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedBooleans, setGeneratedBooleans] = useState<GeneratedBoolean[]>([]);
    const [savedQueries, setSavedQueries] = useState<Set<string>>(new Set());
    const [errorMsg, setErrorMsg] = useState('');
    const matches = approvedJobs.length > 0 ? approvedJobs.filter(j => j.matchScore && j.matchScore >= 5) : scannedJobs.filter(j => j.isMatch);
    const rejections = approvedJobs.length > 0 ? approvedJobs.filter(j => !j.matchScore || j.matchScore < 5) : scannedJobs.filter(j => !j.isMatch);

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        setErrorMsg('');

        try {
            const baseBooleanRaw = matches.find((m: any) => m.booleanSearch)?.booleanSearch || '';
            const response = await fetch('/api/claude/pattern-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matches: matches.map(m => ({ title: m.title, rawText: m.rawText })),
                    rejections: rejections.map(m => ({ title: m.title, rawText: m.rawText })),
                    baseBoolean: baseBooleanRaw
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to generate booleans from Claude');
            }

            const data = await response.json();

            // Map the returned queries to GeneratedBoolean format
            const evaluated = data.queries.map((q: string) => ({
                query: q,
                matchesIncluded: matches.length,
                matchesTotal: matches.length,
                rejectionsExcluded: rejections.length,
                rejectionsTotal: rejections.length,
                matchedIds: matches.map(m => m.id)
            }));

            setGeneratedBooleans(evaluated);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to generate strategies via Claude.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="pattern-engine-container glass-panel" style={{ padding: '24px', marginBottom: '32px', borderLeft: '4px solid var(--accent-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Pattern Analysis Engine
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
                        We compare your {matches.length} matches against {rejections.length} rejections to find the optimal search criteria.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px' }}>
                    {errorMsg}
                </div>
            )}

            <button
                onClick={runAnalysis}
                className="primary-btn pulse-glow"
                disabled={isAnalyzing || matches.length === 0}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px', fontSize: '14px', marginBottom: generatedBooleans.length > 0 ? '24px' : '0' }}
            >
                <Zap size={18} />
                {isAnalyzing ? 'Analyzing Data Patterns...' : 'Analyze Patterns & Generate Boolean'}
            </button>

            {generatedBooleans.length > 0 && (
                <div className="generated-booleans-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--accent-primary)' }}>Optimized GigRadar Booleans:</h4>
                        <button
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            className="secondary-btn"
                            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                        >
                            <Zap size={14} />
                            {isAnalyzing ? 'Regenerating...' : 'Regenerate Strategy'}
                        </button>
                    </div>
                    {generatedBooleans.map((gb, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '16px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontWeight: '600', fontSize: '13px' }}>Strategy Option {idx + 1}</span>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', background: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: '20px' }}>
                                    <span style={{ color: gb.matchesIncluded === gb.matchesTotal ? 'var(--success)' : 'var(--text-secondary)' }}>
                                        Includes Matches: <strong style={{ marginLeft: '4px' }}>{gb.matchesIncluded}/{gb.matchesTotal}</strong>
                                    </span>
                                    <span style={{ color: gb.rejectionsExcluded === gb.rejectionsTotal ? 'var(--success)' : 'var(--danger)' }}>
                                        Excludes Rejections: <strong style={{ marginLeft: '4px' }}>{gb.rejectionsExcluded}/{gb.rejectionsTotal}</strong>
                                    </span>
                                </div>
                            </div>
                            <div className="boolean-code-block" style={{ margin: 0, background: 'var(--bg-primary)' }}>
                                <code style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{gb.query}</code>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                {onSaveIdea && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {savedQueries.has(gb.query) && (
                                            <a
                                                href="/?view=scanner-ideas"
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                View Ideas <ExternalLink size={12} />
                                            </a>
                                        )}
                                        <button
                                            className={savedQueries.has(gb.query) ? "success-btn" : "primary-btn pulse-glow"}
                                            disabled={savedQueries.has(gb.query)}
                                            onClick={() => {
                                                onSaveIdea({
                                                    id: crypto.randomUUID(),
                                                    query: gb.query,
                                                    matchesIncluded: gb.matchesIncluded,
                                                    matchesTotal: gb.matchesTotal,
                                                    rejectionsExcluded: gb.rejectionsExcluded,
                                                    rejectionsTotal: gb.rejectionsTotal,
                                                    dateSaved: new Date().toISOString()
                                                });
                                                setSavedQueries(prev => new Set(prev).add(gb.query));
                                            }}
                                            style={{
                                                fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: savedQueries.has(gb.query) ? 1 : undefined
                                            }}
                                        >
                                            {savedQueries.has(gb.query) ? (
                                                <><Check size={14} /> Saved!</>
                                            ) : (
                                                'Save'
                                            )}
                                        </button>
                                    </div>
                                )}
                                <button
                                    className="secondary-btn"
                                    onClick={() => setTestedStrategy(testedStrategy === gb ? null : gb)}
                                    style={{
                                        fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                                        background: testedStrategy === gb ? 'var(--accent-primary)' : 'transparent',
                                        color: testedStrategy === gb ? '#fff' : 'var(--text-primary)',
                                        borderColor: testedStrategy === gb ? 'var(--accent-primary)' : 'var(--border-color)'
                                    }}
                                >
                                    <Zap size={14} />
                                    {testedStrategy === gb ? 'Clear Test Filter' : 'Test Strategy on Data'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
