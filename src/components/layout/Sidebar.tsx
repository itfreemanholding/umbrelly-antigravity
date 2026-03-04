
import {
    Zap,
    Archive,
    PieChart,
    Database,
    BrainCircuit,
    Settings,
    Lightbulb,
    Send,
    MessageSquare
} from 'lucide-react';
import type { AppState } from '../../App';

interface SidebarProps {
    currentView: AppState;
    onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Zap size={20} />
                </div>
                <span className="logo-text text-gradient">RevOps AI</span>
            </div>

            <nav className="sidebar-nav">
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
                    className={`nav-item ${currentView === 'results' ? 'active' : ''} ${currentView !== 'results' ? 'disabled' : ''}`}
                    onClick={() => currentView === 'results' && onNavigate('results')}
                    disabled={currentView !== 'results'}
                >
                    <PieChart className="nav-icon" />
                    Output Hub
                </button>

                <button
                    className={`nav-item ${currentView === 'scanner' ? 'active' : ''}`}
                    onClick={() => onNavigate('scanner')}
                >
                    <BrainCircuit className="nav-icon" />
                    Scanner Hub
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
        </aside>
    );
}
