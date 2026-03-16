import { TrendingUp, ArrowRight } from 'lucide-react';

export function ScaleView() {
    return (
        <div className="fade-in-up" style={{ padding: '32px 48px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="ingestion-header" style={{ marginBottom: '32px' }}>
                <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingUp size={32} /> Scale Operations
                </h1>
                <p className="subtitle" style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Scale successful experiments into automated, high-volume RevOps pipelines.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <TrendingUp size={48} color="var(--success)" style={{ marginBottom: '16px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Scale Engine Ready</h2>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
                    This hub will manage deployment, automated volume routing, and performance tracking for validated models.
                </p>
                <button className="primary-btn pulse-glow" style={{ margin: '0 auto' }}>
                    Deploy Scale Engine <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
