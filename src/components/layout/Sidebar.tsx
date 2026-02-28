
import {
    Database,
    Activity,
    PieChart,
    Zap
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
                    className={`nav-item ${currentView === 'processing' ? 'active' : ''} ${currentView === 'ingestion' ? 'disabled' : ''}`}
                    onClick={() => currentView !== 'ingestion' && onNavigate('processing')}
                    disabled={currentView === 'ingestion'}
                >
                    <Activity className="nav-icon" />
                    Analysis Engine
                </button>

                <button
                    className={`nav-item ${currentView === 'results' ? 'active' : ''} ${currentView !== 'results' ? 'disabled' : ''}`}
                    onClick={() => currentView === 'results' && onNavigate('results')}
                    disabled={currentView !== 'results'}
                >
                    <PieChart className="nav-icon" />
                    Output Hub
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
