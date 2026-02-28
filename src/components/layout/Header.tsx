
import { Search, Bell, Sparkles } from 'lucide-react';

export function Header() {
    return (
        <header className="header fade-in">
            <div className="header-search">
                <Search size={18} color="var(--text-muted)" />
                <input type="text" placeholder="Search projects, templates, or insights..." />
            </div>

            <div className="header-actions">
                <button className="glass-panel" style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                }}>
                    <Sparkles size={16} color="var(--accent-secondary)" />
                    <span>New Pipeline</span>
                </button>

                <button className="action-btn">
                    <Bell size={18} />
                    <span className="notification-dot"></span>
                </button>
            </div>
        </header>
    );
}
