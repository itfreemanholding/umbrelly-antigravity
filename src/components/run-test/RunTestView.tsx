import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, ArrowRight, Plus, Activity, Trash2, Save, X, Info, AlertTriangle, Edit3 } from 'lucide-react';
import { RichTextEditor } from '../common/RichTextEditor';
import './RunTestView.css';

const cleanEmptyLines = (html: string | undefined | null) => {
    if (!html) return '';
    return html.replace(/(<div><br><\/div>|<br\s*\/?>|\s|&nbsp;|\n)+$/gi, '');
};

export interface BusinessEconomics {
    contracts: number;
    revenuePerContract: number;
    cac: number;
    productionCostPerContract: number;
    coreTeamCost: number;
    rawNotes?: string;
}

export interface Assumption {
    id: string;
    title: string;
    description: string;
    riskLevel: 'High' | 'Medium' | 'Low';
}

export interface Experiment {
    channel: string;
    methodology: string;
    goCriteria: string;
    iterateCriteria: string;
    killCriteria: string;
    budget: string;
    timeline: string;
}

export interface HypothesisTest {
    id: string;
    title: string;
    description: string;
    status: 'Draft' | 'Running' | 'Completed' | 'Killed';
    economics: BusinessEconomics;
    assumptions: Assumption[];
    experiment: Experiment;
    dateCreated: string;
}

const DEFAULT_ECONOMICS: BusinessEconomics = {
    contracts: 0,
    revenuePerContract: 0,
    cac: 0,
    productionCostPerContract: 0,
    coreTeamCost: 0,
    rawNotes: ''
};

const DEFAULT_EXPERIMENT: Experiment = {
    channel: '',
    methodology: '',
    goCriteria: '',
    iterateCriteria: '',
    killCriteria: '',
    budget: '',
    timeline: ''
};

export function RunTestView() {
    const [hypotheses, setHypotheses] = useState<HypothesisTest[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [isDescEditing, setIsDescEditing] = useState(false);
    
    // Auto-save & UX Feedback States
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State
    const [testId, setTestId] = useState('');
    const [title, setTitle] = useState('New Growth Hypothesis');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'Draft' | 'Running' | 'Completed' | 'Killed'>('Draft');
    const [economics, setEconomics] = useState<BusinessEconomics>(DEFAULT_ECONOMICS);
    const [assumptions, setAssumptions] = useState<Assumption[]>([]);
    const [experiment, setExperiment] = useState<Experiment>(DEFAULT_EXPERIMENT);
    
    // AI Extraction State
    const [isRawNotesEditing, setIsRawNotesEditing] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    useEffect(() => {
        fetchHypotheses();
    }, []);

    const fetchHypotheses = async () => {
        try {
            const res = await fetch('/api/hypotheses', {
                headers: { 'x-project-id': localStorage.getItem('activeProjectId') || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setHypotheses(data);
            }
        } catch (err) {
            console.error("Failed to load hypotheses", err);
        }
    };

    const handleSave = async (closeOnSave: boolean = true) => {
        setIsSaving(true);
        const payload: HypothesisTest = {
            id: testId || Date.now().toString(),
            title,
            description,
            status,
            economics,
            assumptions,
            experiment,
            dateCreated: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/hypotheses', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-project-id': localStorage.getItem('activeProjectId') || ''
                },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                const updatedTargetId = payload.id;
                if (!testId) setTestId(updatedTargetId);
                fetchHypotheses();
                if (closeOnSave) {
                    setIsEditing(false);
                } else {
                    setShowSaved(true);
                    setTimeout(() => setShowSaved(false), 2000);
                }
            }
        } catch (err) {
            console.error("Failed to save Hypothesis", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExtractEconomics = async () => {
        if (!economics.rawNotes?.trim()) return;
        setIsExtracting(true);
        setToastMessage('Brainstorming economics via AI...');
        
        try {
            const res = await fetch('/api/claude/extract-economics', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-project-id': localStorage.getItem('activeProjectId') || ''
                },
                body: JSON.stringify({ text: economics.rawNotes })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.economics) {
                    setEconomics(prev => ({
                        ...prev,
                        contracts: Number(data.economics.contracts) || 0,
                        revenuePerContract: Number(data.economics.revenuePerContract) || 0,
                        cac: Number(data.economics.cac) || 0,
                        productionCostPerContract: Number(data.economics.productionCostPerContract) || 0,
                        coreTeamCost: Number(data.economics.coreTeamCost) || 0
                    }));
                    setToastMessage('Economics successfully extracted & mapped!');
                    setTimeout(() => setToastMessage(null), 3500);
                }
            } else {
                setToastMessage('Extraction failed. Try re-formatting your notes.');
                setTimeout(() => setToastMessage(null), 3500);
            }
        } catch (err) {
            console.error(err);
            setToastMessage('Network error during extraction.');
            setTimeout(() => setToastMessage(null), 3500);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteCandidate(id);
    };

    const confirmDelete = async () => {
        if (!deleteCandidate) return;
        try {
            await fetch(`/api/hypotheses/${deleteCandidate}`, {
                method: 'DELETE',
                headers: { 'x-project-id': localStorage.getItem('activeProjectId') || '' }
            });
            setDeleteCandidate(null);
            fetchHypotheses();
            setToastMessage('Hypothesis deleted permanently');
            setTimeout(() => setToastMessage(null), 3500);
        } catch (err) {
            console.error(err);
        }
    };

    // Auto-save effect
    useEffect(() => {
        if (!isEditing) return;
        
        const saveDraft = async () => {
            setIsAutoSaving(true);
            const currentId = testId || Date.now().toString();
            const payload: HypothesisTest = {
                id: currentId,
                title,
                description,
                status,
                economics,
                assumptions,
                experiment,
                dateCreated: new Date().toISOString() // Assuming backend handles upserts safely or ignores date override
            };

            try {
                await fetch('/api/hypotheses', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-project-id': localStorage.getItem('activeProjectId') || ''
                    },
                    body: JSON.stringify(payload)
                });
                if (!testId) setTestId(currentId);
                fetchHypotheses(); // keep hub up to date in background
                setLastSavedTime(new Date());
            } catch (err) {
                console.error("Auto-save failed", err);
            } finally {
                setTimeout(() => setIsAutoSaving(false), 600);
            }
        };

        const timeoutId = setTimeout(() => {
            // Only autosave if there's actually some content to avoid spamming empty drafts
            if (title.trim() !== '' || description.trim() !== '' || economics.contracts > 0 || assumptions.length > 0) {
                saveDraft();
            }
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [title, description, status, economics, assumptions, experiment, isEditing]); // Exclude testId to prevent double-fire upon generation

    const openBuilder = (h?: HypothesisTest) => {
        if (h) {
            setTestId(h.id);
            setTitle(h.title);
            setDescription(h.description || '');
            setStatus(h.status);
            setEconomics(h.economics || DEFAULT_ECONOMICS);
            setAssumptions(h.assumptions || []);
            setExperiment(h.experiment || DEFAULT_EXPERIMENT);
            setIsDescEditing(!h.description);
            setIsRawNotesEditing(!(h.economics?.rawNotes));
        } else {
            setTestId('');
            setTitle('New Growth Hypothesis');
            setDescription('');
            setStatus('Draft');
            setEconomics(DEFAULT_ECONOMICS);
            setAssumptions([]);
            setExperiment(DEFAULT_EXPERIMENT);
            setIsDescEditing(true);
            setIsRawNotesEditing(true);
        }
        setActiveStep(0);
        setIsEditing(true);
    };

    // Sub-renderers
    const renderHub = () => (
        <div className="run-test-hub fade-in-up" style={{ padding: '32px 48px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="hub-controls">
                <div className="ingestion-header" style={{ marginBottom: 0 }}>
                    <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Target size={32} /> Hypothesis Engine
                    </h1>
                    <p className="subtitle" style={{ fontSize: '15px', marginTop: '8px' }}>
                        Design, track, and scale go-to-market experiments based on core business economics.
                    </p>
                </div>
                <button className="primary-btn pulse-glow" onClick={() => openBuilder()}>
                    <Plus size={16} /> New Hypothesis
                </button>
            </div>

            {hypotheses.length === 0 ? (
                <div className="glass-panel" style={{ padding: '64px', textAlign: 'center', marginTop: '32px' }}>
                    <Activity size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No Active Tests</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't built any business hypotheses yet.</p>
                </div>
            ) : (
                <div className="hypotheses-grid" style={{ marginTop: '32px' }}>
                    {hypotheses.map(h => {
                        const rev = (h.economics?.contracts || 0) * (h.economics?.revenuePerContract || 0);
                        const exp = ((h.economics?.contracts || 0) * (h.economics?.cac || 0)) +
                                    ((h.economics?.contracts || 0) * (h.economics?.productionCostPerContract || 0)) + 
                                    (h.economics?.coreTeamCost || 0);
                        const margin = rev > 0 ? (((rev - exp) / rev) * 100).toFixed(1) : '0.0';

                        return (
                            <div key={h.id} className="hypothesis-card" onClick={() => openBuilder(h)}>
                                <div className="card-header">
                                    <h3 className="card-title">{h.title}</h3>
                                    <span className={`card-status status-${h.status.toLowerCase()}`}>{h.status}</span>
                                </div>
                                <div className="card-metrics">
                                    <div className="metric-item">
                                        <span className="metric-label">Proj. Net Margin</span>
                                        <span className="metric-value" style={{ color: Number(margin) > 20 ? 'var(--success)' : 'inherit' }}>
                                            {margin}%
                                        </span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Risks</span>
                                        <span className="metric-value">{h.assumptions?.length || 0} Triggers</span>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <span>{new Date(h.dateCreated).toLocaleDateString()}</span>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(h.id, e); }} 
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderDescriptionStep = () => (
        <div className="fade-in-up">
            <div className="input-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <label style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        Business Thesis & Hypothesis Core
                    </label>
                    {!isDescEditing && (
                        <button className="secondary-btn" onClick={() => setIsDescEditing(true)} style={{ padding: '6px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Edit3 size={14}/> Edit Description
                        </button>
                    )}
                </div>
                
                {isDescEditing ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <RichTextEditor value={description} onChange={setDescription} />
                        <button className="primary-btn pulse-glow" onClick={() => setIsDescEditing(false)} style={{ alignSelf: 'flex-start', padding: '8px 24px' }}>
                            Lock & View
                        </button>
                    </div>
                ) : (
                    <div 
                        className="fade-in rich-text-content"
                        style={{ 
                            fontSize: '15px', lineHeight: '1.8', color: 'var(--text-secondary)',
                            padding: '32px', background: '#ffffff', borderRadius: '12px',
                            border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap'
                        }}
                        dangerouslySetInnerHTML={{ __html: cleanEmptyLines(description) || '<span style="opacity: 0.5">No hypothesis description provided. Click edit to begin writing.</span>' }}
                    />
                )}
            </div>
        </div>
    );

    const renderEconomicsStep = () => {
        const rev = economics.contracts * economics.revenuePerContract;
        const acq = economics.contracts * economics.cac;
        const prod = economics.contracts * economics.productionCostPerContract;
        const expenses = acq + prod + economics.coreTeamCost;
        const netProfit = rev - expenses;
        const margin = rev > 0 ? ((netProfit / rev) * 100).toFixed(1) : '0';

        return (
            <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="ai-extractor-panel" style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', margin: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}><path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Auto-Magic Extraction
                        </h4>
                        {!isRawNotesEditing && (
                            <button className="secondary-btn" onClick={() => setIsRawNotesEditing(true)} style={{ padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', height: 'auto' }}>
                                <Edit3 size={12}/> Edit Notes
                            </button>
                        )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                        Paste rough notes, napkin math, or strategy ideas. AI will parse your unstructured text and attempt to map the 5 variables instantly.
                    </p>
                    
                    {isRawNotesEditing ? (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                            <RichTextEditor 
                                value={economics.rawNotes || ''} 
                                onChange={val => setEconomics({...economics, rawNotes: val})} 
                            />
                            <button className="primary-btn pulse-glow" onClick={() => setIsRawNotesEditing(false)} style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '13px' }}>
                                Lock & View
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="fade-in rich-text-content"
                            style={{ 
                                fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)',
                                padding: '16px', background: '#ffffff', borderRadius: '8px',
                                border: '1px solid var(--border-color)', marginBottom: '16px',
                                whiteSpace: 'pre-wrap'
                            }}
                            dangerouslySetInnerHTML={{ __html: cleanEmptyLines(economics.rawNotes) || '<span style="opacity: 0.5">No rough notes provided. Click edit to paste your napkin math.</span>' }}
                        />
                    )}

                    <button 
                        className="primary-btn" 
                        onClick={handleExtractEconomics}
                        disabled={isExtracting || !economics.rawNotes?.trim()}
                        style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-primary)', opacity: isExtracting || !economics.rawNotes?.trim() ? 0.6 : 1 }}
                    >
                        {isExtracting ? 'Analyzing Notes...' : 'Generate Economics ✨'}
                    </button>
                </div>

                <div className="economics-grid">
                    <div className="input-section">
                        <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Unit Economics</h4>
                        
                        <div className="input-group">
                            <label>Target Contracts (Volume)</label>
                            <input type="number" className="input-area" value={economics.contracts || ''} onChange={e => setEconomics({...economics, contracts: Number(e.target.value) || 0})} />
                        </div>
                        
                        <div className="input-group">
                            <label>Avg. Revenue per Contract ($)</label>
                            <input type="number" className="input-area" value={economics.revenuePerContract || ''} onChange={e => setEconomics({...economics, revenuePerContract: Number(e.target.value) || 0})} />
                        </div>

                        <div className="input-group">
                            <label>Target CAC ($)</label>
                            <input type="number" className="input-area" value={economics.cac || ''} onChange={e => setEconomics({...economics, cac: Number(e.target.value) || 0})} />
                        </div>

                        <div className="input-group">
                            <label>Production Cost per Contract ($)</label>
                            <input type="number" className="input-area" value={economics.productionCostPerContract || ''} onChange={e => setEconomics({...economics, productionCostPerContract: Number(e.target.value) || 0})} />
                        </div>

                        <div className="input-group">
                            <label>Annual Core Team Cost ($)</label>
                            <input type="number" className="input-area" value={economics.coreTeamCost || ''} onChange={e => setEconomics({...economics, coreTeamCost: Number(e.target.value) || 0})} />
                        </div>
                    </div>

                    <div className="calc-panel-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="calc-panel" style={{ height: '100%' }}>
                            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={18} /> Model Projection
                            </h4>
                        
                            <div className="calc-row"><span>Gross Revenue:</span> <span>${rev.toLocaleString()}</span></div>
                            <div className="calc-row"><span>Total Acquisition:</span> <span style={{color: 'var(--text-error)'}}>-${acq.toLocaleString()}</span></div>
                            <div className="calc-row"><span>Total Production:</span> <span style={{color: 'var(--text-error)'}}>-${prod.toLocaleString()}</span></div>
                            <div className="calc-row"><span>Core Team Engine:</span> <span style={{color: 'var(--text-error)'}}>-${economics.coreTeamCost.toLocaleString()}</span></div>
                            
                            <div className="calc-row total">
                                <span>Net Profit:</span> 
                                <span>${netProfit.toLocaleString()}</span>
                            </div>
                            
                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Projected Net Margin</span>
                                <div className="margin-highlight" style={{ color: Number(margin) > 20 ? 'var(--success)' : Number(margin) > 0 ? 'var(--warning)' : 'var(--text-error)' }}>
                                    {margin}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAssumptionsStep = () => (
        <div className="fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Identify the core risks separating this idea from reality. Rank them by uncertainty.</p>
                <button 
                    className="secondary-btn"
                    onClick={() => setAssumptions([...assumptions, { id: Date.now().toString(), title: '', description: '', riskLevel: 'High' }])}
                >
                    <Plus size={14} /> Add Assumption
                </button>
            </div>

            <div className="assumptions-list">
                {assumptions.map((a, i) => (
                    <div key={a.id} className="assumption-item">
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="assumption-header">
                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>A{i+1}.</span>
                                <input 
                                    type="text" 
                                    className="input-area" 
                                    style={{ flex: 1, marginLeft: '12px', height: '36px' }}
                                    placeholder="Assumption Type (e.g. Demand, Channel, Price)"
                                    value={a.title}
                                    onChange={e => {
                                        const newA = [...assumptions];
                                        newA[i].title = e.target.value;
                                        setAssumptions(newA);
                                    }}
                                />
                                <CustomSelect 
                                    className="input-area" 
                                    style={{ width: '140px', marginLeft: '12px', height: '36px', padding: 0 }}
                                    value={a.riskLevel}
                                    onChange={(val: any) => {
                                        const newA = [...assumptions];
                                        newA[i].riskLevel = val;
                                        setAssumptions(newA);
                                    }}
                                    options={[
                                        { value: 'High', label: 'High Risk' },
                                        { value: 'Medium', label: 'Medium Risk' },
                                        { value: 'Low', label: 'Low Risk' }
                                    ]}
                                />
                                <button 
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginLeft: '12px', cursor: 'pointer' }}
                                    onClick={() => setAssumptions(assumptions.filter(x => x.id !== a.id))}
                                ><X size={16} /></button>
                            </div>
                            <textarea
                                className="input-area"
                                placeholder="What must be true? e.g. We can acquire qualified demo calls via Cold Email for < $500..."
                                rows={2}
                                value={a.description}
                                onChange={e => {
                                    const newA = [...assumptions];
                                    newA[i].description = e.target.value;
                                    setAssumptions(newA);
                                }}
                            />
                        </div>
                    </div>
                ))}
                {assumptions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                        No assumptions added. Define what must be true for this business to succeed.
                    </div>
                )}
            </div>
        </div>
    );

    const renderExperimentStep = () => (
        <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div className="input-section">
                <div className="input-group">
                    <label>Target Channel</label>
                    <input type="text" className="input-area" placeholder="e.g. LinkedIn Outreach, Google Ads" value={experiment.channel} onChange={e => setExperiment({...experiment, channel: e.target.value})} />
                </div>
                
                <div className="input-group">
                    <label>Methodology</label>
                    <textarea className="input-area" rows={4} placeholder="We will scrape 500 CEOs from Sales Navigator and send 2 variants of cold emails..." value={experiment.methodology} onChange={e => setExperiment({...experiment, methodology: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Test Budget</label>
                        <input type="text" className="input-area" placeholder="e.g. $400" value={experiment.budget} onChange={e => setExperiment({...experiment, budget: e.target.value})} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Timeline</label>
                        <input type="text" className="input-area" placeholder="e.g. 3 Weeks" value={experiment.timeline} onChange={e => setExperiment({...experiment, timeline: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="input-section">
                <div className="input-group">
                    <label style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14}/> Success Criteria (GO)</label>
                    <textarea className="input-area" rows={2} placeholder="e.g. >5 Demos Booked, >2% Reply Rate, CAC < $500" value={experiment.goCriteria} onChange={e => setExperiment({...experiment, goCriteria: e.target.value})} />
                </div>

                <div className="input-group">
                    <label style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={14}/> Uncertainty (ITERATE)</label>
                    <textarea className="input-area" rows={2} placeholder="e.g. 2-4 Demos Booked, 1-2% Reply Rate. Needs A/B tweaking." value={experiment.iterateCriteria} onChange={e => setExperiment({...experiment, iterateCriteria: e.target.value})} />
                </div>

                <div className="input-group">
                    <label style={{ color: 'var(--text-error)', display: 'flex', alignItems: 'center', gap: '8px' }}><X size={14}/> Pivot Criteria (KILL)</label>
                    <textarea className="input-area" rows={2} placeholder="e.g. 0-1 Demos Booked, <1% Reply Rate. Switch channel." value={experiment.killCriteria} onChange={e => setExperiment({...experiment, killCriteria: e.target.value})} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="run-test-wrapper" style={{ width: '100%', paddingBottom: '32px' }}>
            {!isEditing ? renderHub() : (
                <div className="fade-in-up" style={{ padding: '32px 48px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="builder-layout">
                        <div className="builder-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <input 
                                    type="text" 
                                    className="title-input" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="Hypothesis Title" 
                                    style={{ margin: 0 }}
                                />
                                <div style={{ 
                                    fontSize: '13px', 
                                    color: 'var(--text-muted)', 
                                    opacity: isAutoSaving || (lastSavedTime && new Date().getTime() - lastSavedTime.getTime() < 3000) ? 1 : 0,
                                    transition: 'opacity 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {isAutoSaving ? <Activity size={14} className="spin" /> : <Save size={14} />}
                                    {isAutoSaving ? 'Saving...' : 'Draft saved'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <CustomSelect 
                                    className="input-area" 
                                    style={{ height: '36px', width: '130px', background: 'var(--bg-secondary)', border: 'none', padding: 0 }}
                                    value={status}
                                    onChange={(val: any) => setStatus(val)}
                                    options={[
                                        { value: 'Draft', label: 'Draft' },
                                        { value: 'Running', label: '⚙️ Running' },
                                        { value: 'Completed', label: '✅ Completed' },
                                        { value: 'Killed', label: '❌ Killed' }
                                    ]}
                                />
                                <button className="secondary-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button 
                                    className="primary-btn" 
                                    onClick={() => handleSave(false)} 
                                    disabled={isSaving}
                                    style={{ 
                                        gap: '8px', 
                                        opacity: isSaving ? 0.7 : 1,
                                        background: showSaved ? 'var(--success)' : '',
                                        transition: 'background 0.3s ease, opacity 0.2s ease, transform 0.2s ease'
                                    }}
                                >
                                    <Save size={16} /> 
                                    {isSaving ? 'Saving...' : showSaved ? 'Saved!' : 'Save Setup'}
                                </button>
                            </div>
                        </div>

                        <div className="stepper-nav">
                            <button className={`step-tab ${activeStep === 0 ? 'active' : ''}`} onClick={() => setActiveStep(0)}>
                                Step 0: Description
                            </button>
                            <button className={`step-tab ${activeStep === 1 ? 'active' : ''}`} onClick={() => setActiveStep(1)}>
                                Step 1: Economics
                            </button>
                            <button className={`step-tab ${activeStep === 2 ? 'active' : ''}`} onClick={() => setActiveStep(2)}>
                                Step 2: Assumptions ({assumptions.length})
                            </button>
                            <button className={`step-tab ${activeStep === 3 ? 'active' : ''}`} onClick={() => setActiveStep(3)}>
                                Step 3: Experiment
                            </button>
                        </div>

                        <div className="builder-body">
                            {activeStep === 0 && renderDescriptionStep()}
                            {activeStep === 1 && renderEconomicsStep()}
                            {activeStep === 2 && renderAssumptionsStep()}
                            {activeStep === 3 && renderExperimentStep()}
                        </div>

                        <div className="builder-footer">
                            {activeStep > 0 && <button className="secondary-btn" onClick={() => setActiveStep(v => v-1)}>Previous Step</button>}
                            {activeStep < 3 && <button className="primary-btn pulse-glow" onClick={() => setActiveStep(v => v+1)}>Next Step <ArrowRight size={16}/></button>}
                            {activeStep === 3 && (
                                <button className="primary-btn" onClick={() => handleSave(true)} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
                                    <CheckCircle size={16}/> {isSaving ? 'Completing...' : 'Complete'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteCandidate && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10, 10, 11, 0.8)', backdropFilter: 'blur(4px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="fade-in-up" style={{
                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', textAlign: 'center'
                    }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--text-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontSize: '20px' }}>Delete Hypothesis?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                            This action cannot be undone. All experiments, assumptions, and modeled economics will be permanently removed.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="secondary-btn" onClick={() => setDeleteCandidate(null)} style={{ flex: 1 }}>Cancel</button>
                            <button className="primary-btn" onClick={confirmDelete} style={{ flex: 1, background: 'var(--danger)', color: '#ffffff' }}>Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {toastMessage && createPortal(
                <div className="fade-in-up" style={{ 
                    position: 'fixed', bottom: '32px', right: '32px', zIndex: 99999,
                    background: 'var(--text-primary)', color: 'var(--bg-primary)', 
                    padding: '16px 24px', borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <CheckCircle size={20} color="var(--success)" />
                    <span style={{ fontWeight: 500, fontSize: '15px' }}>{toastMessage}</span>
                </div>, 
                document.body
            )}
        </div>
    );
}

// Inline missing icon
function CheckCircle(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

// Custom Glassmorphism Select Component
function CustomSelect({ options, value, onChange, style, className }: any) {
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        const handleClick = () => setIsOpen(false);
        if (isOpen) {
            window.addEventListener('click', handleClick);
        }
        return () => window.removeEventListener('click', handleClick);
    }, [isOpen]);

    const selectedOption = options.find((o: any) => o.value === value) || options[0];

    return (
        <div style={{ position: 'relative', ...style }} className={className} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
            <div style={{ 
                height: '100%', 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0 12px',
                cursor: 'pointer',
                background: 'transparent',
                borderRadius: 'inherit'
            }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedOption.label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: '8px', opacity: 0.7 }}><path d="m6 9 6 6 6-6"/></svg>
            </div>
            {isOpen && (
                <div className="fade-in-up" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: '100%',
                    marginTop: '4px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)'
                }}>
                    {options.map((opt: any) => (
                        <div 
                            key={opt.value}
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'background 0.2s ease',
                                background: value === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: value === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={e => {
                                if (value !== opt.value) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = value === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'transparent';
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
