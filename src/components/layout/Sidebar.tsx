import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Zap,
    Archive,
    PieChart,
    Database,
    Settings,
    Lightbulb,
    Send,
    MousePointerClick,
    MessageSquare,
    KeyRound,
    Bot,
    ChevronDown,
    Plus,
    Check,
    Folder,
    MoreVertical,
    X,
    Trash2,
    Edit2,
    Activity,
    Target,
    TrendingUp
} from 'lucide-react';
import type { AppState } from '../../App';

interface SidebarProps {
    currentView: AppState;
    onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [activeProject, setActiveProject] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data.projects || []);
                let currentActive: string | null = localStorage.getItem('activeProjectId');
                if (!currentActive && data.activeProject) {
                    currentActive = data.activeProject as string;
                    localStorage.setItem('activeProjectId', currentActive);
                }
                setActiveProject(currentActive || '');

            })
            .catch(console.error);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitchProject = async (id: string) => {
        try {
            localStorage.setItem('activeProjectId', id);
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName.trim() })
            });
            const data = await res.json();
            if (data.success && data.project) {
                localStorage.setItem('activeProjectId', data.project.id);
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const handleRenameProject = async () => {
        if (!newProjectName.trim() || !selectedProject) return;
        setIsSubmitting(true);
        try {
            await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName.trim() })
            });
            window.location.reload();
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!selectedProject) return;
        setIsSubmitting(true);
        try {
            await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'DELETE'
            });
            if (localStorage.getItem('activeProjectId') === selectedProject.id) {
                localStorage.removeItem('activeProjectId');
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setNewProjectName('');
        setShowCreateModal(true);
        setIsDropdownOpen(false);
    };

    const openRenameModal = (p: any) => {
        setSelectedProject(p);
        setNewProjectName(p.name);
        setShowRenameModal(true);
        setProjectMenuOpen(null);
        setIsDropdownOpen(false);
    };

    const openDeleteModal = (p: any) => {
        setSelectedProject(p);
        setShowDeleteModal(true);
        setProjectMenuOpen(null);
        setIsDropdownOpen(false);
    };

    const activeProjectName = projects.find(p => p.id === activeProject)?.name || 'Loading...';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ marginBottom: '16px' }}>
                <div className="logo-icon">
                    <Zap size={20} />
                </div>
                <span className="logo-text text-gradient">RevOps AI</span>
            </div>

            <div className="project-switcher" ref={dropdownRef} style={{ padding: '0 16px', position: 'relative', marginBottom: '16px' }}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Folder size={16} className="text-accent" />
                        <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeProjectName}
                        </span>
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--text-secondary)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {isDropdownOpen && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: '16px', right: '16px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: '8px', zIndex: 100, overflow: 'visible',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                            {projects.map(p => (
                                <div key={p.id} style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => handleSwitchProject(p.id)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)',
                                            color: p.id === activeProject ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                            fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            {p.id === activeProject && <Check size={14} />}
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: p.id === activeProject ? 600 : 400 }}>{p.name}</span>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProjectMenuOpen(projectMenuOpen === p.id ? null : p.id);
                                        }}
                                        style={{ 
                                            position: 'absolute', right: '8px', top: '8px', background: 'transparent', 
                                            border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px',
                                            borderRadius: '4px'
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                                    >
                                        <MoreVertical size={14} />
                                    </button>

                                    {projectMenuOpen === p.id && (
                                        <div style={{
                                            position: 'absolute', right: '28px', top: '16px', background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 101, minWidth: '100px'
                                        }}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openRenameModal(p); }}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
                                                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                            ><Edit2 size={12}/> Rename</button>
                                            
                                            {projects.length > 1 && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(p); }}
                                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-error)', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
                                                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                                                ><Trash2 size={12}/> Delete</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={openCreateModal}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 12px', background: 'rgba(99, 102, 241, 0.1)', border: 'none',
                                color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)')}
                        >
                            <Plus size={14} /> Create New Project
                        </button>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group-title" style={{ paddingLeft: '12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Growth Engine</div>
                <button
                    className={`nav-item ${currentView === 'run-test' ? 'active' : ''}`}
                    onClick={() => onNavigate('run-test')}
                >
                    <Target className="nav-icon text-success" />
                    Run Test
                </button>

                <button
                    className={`nav-item ${currentView === 'scale' ? 'active' : ''}`}
                    onClick={() => onNavigate('scale')}
                >
                    <TrendingUp className="nav-icon text-success" />
                    Scale
                </button>

                <div className="nav-group-title" style={{ marginTop: '16px', paddingLeft: '12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Data & Operations</div>
                <button
                    className={`nav-item ${currentView === 'ingestion' ? 'active' : ''}`}
                    onClick={() => onNavigate('ingestion')}
                >
                    <Database className="nav-icon" />
                    Data Ingestion
                </button>

                <button
                    className={`nav-item ${currentView === 'data' ? 'active' : ''}`}
                    onClick={() => onNavigate('data')}
                >
                    <Archive className="nav-icon" />
                    Data Hub
                </button>

                <button
                    className={`nav-item ${currentView === 'tracking' ? 'active' : ''}`}
                    onClick={() => onNavigate('tracking')}
                >
                    <Activity className="nav-icon" />
                    Website Tracking
                </button>

                <button
                    className={`nav-item ${currentView === 'results' ? 'active' : ''}`}
                    onClick={() => onNavigate('results')}
                >
                    <PieChart className="nav-icon" />
                    RevOPS
                </button>

                <button
                    className={`nav-item ${currentView === 'configurator' ? 'active' : ''}`}
                    onClick={() => onNavigate('configurator')}
                >
                    <Settings className="nav-icon" />
                    Configuring Scanners
                </button>

                <button
                    className={`nav-item ${currentView === 'scanner-ideas' ? 'active' : ''}`}
                    onClick={() => onNavigate('scanner-ideas')}
                >
                    <Lightbulb className="nav-icon" />
                    Scanner Ideas
                </button>

                <button
                    className={`nav-item ${currentView === 'keywords' ? 'active' : ''}`}
                    onClick={() => onNavigate('keywords')}
                >
                    <KeyRound className="nav-icon text-warning" />
                    Keywords
                </button>

                <button
                    className={`nav-item ${currentView === 'outreach' ? 'active' : ''}`}
                    onClick={() => onNavigate('outreach')}
                >
                    <Send className="nav-icon" />
                    Outreach Gen
                </button>

                <button
                    className={`nav-item ${currentView === 'outreach-ideas' ? 'active' : ''}`}
                    onClick={() => onNavigate('outreach-ideas')}
                >
                    <MessageSquare className="nav-icon" />
                    Outreach Ideas
                </button>

                <button
                    className={`nav-item ${currentView === 'google-ads' ? 'active' : ''}`}
                    onClick={() => onNavigate('google-ads')}
                >
                    <MousePointerClick className="nav-icon" />
                    Google Ads
                </button>

                <button
                    className={`nav-item ${currentView === 'google-ads-ideas' ? 'active' : ''}`}
                    onClick={() => onNavigate('google-ads-ideas')}
                >
                    <MousePointerClick className="nav-icon" />
                    Google Ads Ideas
                </button>

                <div className="nav-group-title" style={{ marginTop: '16px', paddingLeft: '12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Autonomy</div>
                <button
                    className={`nav-item ${currentView === 'agent' ? 'active' : ''}`}
                    onClick={() => onNavigate('agent')}
                >
                    <Bot className="nav-icon text-accent" />
                    Booking Agent
                </button>
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>JD</span>
                    </div>
                    <div className="user-info">
                        <span className="user-name">Jane Doe</span>
                        <span className="user-role">Growth Lead</span>
                    </div>
                </div>
            </div>

            {/* Modal Overlay Component */}
            {(showCreateModal || showRenameModal || showDeleteModal) && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10, 10, 11, 0.8)', backdropFilter: 'blur(4px)',
                    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative'
                    }}>
                        <button 
                            onClick={() => { setShowCreateModal(false); setShowRenameModal(false); setShowDeleteModal(false); }}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        ><X size={18} /></button>
                        
                        {showCreateModal && (
                            <>
                                <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '18px' }}>Create New Project</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>This project will have a completely isolated data workspace.</p>
                                <input 
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g. Acme Corp Automation"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginBottom: '20px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button onClick={handleCreateProject} disabled={isSubmitting || !newProjectName.trim()} className="btn btn-primary">{isSubmitting ? 'Creating...' : 'Create Project'}</button>
                                </div>
                            </>
                        )}

                        {showRenameModal && selectedProject && (
                            <>
                                <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '18px' }}>Rename Project</h3>
                                <input 
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameProject()}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginBottom: '20px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button onClick={() => setShowRenameModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button onClick={handleRenameProject} disabled={isSubmitting || !newProjectName.trim()} className="btn btn-primary">{isSubmitting ? 'Saving...' : 'Save Name'}</button>
                                </div>
                            </>
                        )}

                        {showDeleteModal && selectedProject && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-error)' }}>
                                        <Trash2 size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>Delete Project?</h3>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>
                                    You are about to permanently delete <strong>{selectedProject.name}</strong>.
                                </p>
                                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>
                                    <p style={{ margin: 0, color: 'var(--text-error)', fontSize: '13px', fontWeight: 500 }}>
                                        Warning: This action will permanently destroy the associated SQLite database file. All saved jobs, outreach ideas, and data will be unrecoverable. 
                                    </p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button onClick={handleDeleteProject} disabled={isSubmitting} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', opacity: isSubmitting ? 0.7 : 1 }}>
                                        {isSubmitting ? 'Deleting...' : 'Yes, Delete Project'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </aside>
    );
}
