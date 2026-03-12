import React, { useState, useEffect } from 'react';
import { Bot, Key, Play, Square, Activity, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import './AgentDashboard.css';

export const AgentDashboard: React.FC = () => {
    const [porkbunKey, setPorkbunKey] = useState('');
    const [porkbunSecret, setPorkbunSecret] = useState('');
    const [resendKey, setResendKey] = useState('');
    const [calendlyUrl, setCalendlyUrl] = useState('');

    const [isAgentRunning, setIsAgentRunning] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        // Load settings on mount
        const loadSettings = async () => {
            try {
                const keys = ['porkbun_key', 'porkbun_secret', 'resend_key', 'calendly_url', 'agent_status'];
                const results = await Promise.all(keys.map(k => fetch(`/api/settings/${k}`).then(r => r.json())));

                if (results[0].value) setPorkbunKey(results[0].value);
                if (results[1].value) setPorkbunSecret(results[1].value);
                if (results[2].value) setResendKey(results[2].value);
                if (results[3].value) setCalendlyUrl(results[3].value);
                if (results[4].value === 'running') setIsAgentRunning(true);
            } catch (err) {
                console.error("Failed to load settings:", err);
            }
        };

        const loadLogs = async () => {
            try {
                const res = await fetch('/api/agent-logs');
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error("Failed to load agent logs:", err);
            }
        };

        loadSettings();
        loadLogs();

        // Refresh logs every 10 seconds if running
        const interval = setInterval(() => {
            if (isAgentRunning) loadLogs();
        }, 10000);
        return () => clearInterval(interval);
    }, [isAgentRunning]);

    const handleSaveKeys = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            await Promise.all([
                fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'porkbun_key', value: porkbunKey }) }),
                fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'porkbun_secret', value: porkbunSecret }) }),
                fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'resend_key', value: resendKey }) }),
                fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'calendly_url', value: calendlyUrl }) })
            ]);
            setSaveMessage('Configuration saved securely.');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            setSaveMessage('Failed to save configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAgent = async () => {
        const newStatus = isAgentRunning ? 'stopped' : 'running';
        try {
            await fetch('/api/agent/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            setIsAgentRunning(!isAgentRunning);
        } catch (err) {
            console.error("Failed to toggle agent", err);
        }
    };

    return (
        <div className="agent-dashboard fade-in" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Bot className="text-accent" size={32} />
                        Booking Agent Dashboard
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Automated outbound pipeline and domain provisioning.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '20px',
                        background: isAgentRunning ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isAgentRunning ? 'var(--success)' : 'var(--danger)',
                        fontWeight: '600', fontSize: '14px', border: `1px solid ${isAgentRunning ? 'var(--success)' : 'var(--danger)'}`
                    }}>
                        <Activity size={16} className={isAgentRunning ? 'spin' : ''} style={{ animationDuration: '3s' }} />
                        {isAgentRunning ? 'Agent Active' : 'Agent Paused'}
                    </div>

                    <button
                        onClick={toggleAgent}
                        className={isAgentRunning ? "danger-hover glass-panel" : "primary-btn pulse-glow"}
                        style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', border: isAgentRunning ? '1px solid var(--danger)' : 'none' }}
                    >
                        {isAgentRunning ? <><Square size={16} /> Stop Agent</> : <><Play size={16} /> Start Agent</>}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>

                {/* Configuration Sidebar */}
                <div className="glass-panel" style={{ padding: '24px', alignSelf: 'start' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <Key size={18} className="text-warning" />
                        API Configuration
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Porkbun API Key</label>
                            <input
                                type="password"
                                value={porkbunKey}
                                onChange={e => setPorkbunKey(e.target.value)}
                                className="input-base"
                                placeholder="pk1_..."
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Porkbun Secret Key</label>
                            <input
                                type="password"
                                value={porkbunSecret}
                                onChange={e => setPorkbunSecret(e.target.value)}
                                className="input-base"
                                placeholder="sk1_..."
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Used to automatically purchase and configure domains.</p>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Resend API Key</label>
                            <input
                                type="password"
                                value={resendKey}
                                onChange={e => setResendKey(e.target.value)}
                                className="input-base"
                                placeholder="re_..."
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Used to send outbound email sequences.</p>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Calendly Booking Link</label>
                            <div className="input-wrapper" style={{ position: 'relative' }}>
                                <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    value={calendlyUrl}
                                    onChange={e => setCalendlyUrl(e.target.value)}
                                    className="input-base"
                                    style={{ paddingLeft: '36px' }}
                                    placeholder="https://calendly.com/your-name/audit"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveKeys} disabled={isSaving}
                            className="secondary-btn"
                            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}
                        >
                            {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>

                        {saveMessage && (
                            <div style={{ fontSize: '13px', color: saveMessage.includes('Failed') ? 'var(--danger)' : 'var(--success)', textAlign: 'center' }}>
                                {saveMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* Agent Activity Terminal */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '600px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <Activity size={18} className="text-accent" />
                        Live Agent Logs
                    </h3>

                    <div className="terminal-container" style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', border: '1px solid #1e293b' }}>
                        {logs.length === 0 ? (
                            <div style={{ color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                                <Bot size={48} opacity={0.5} />
                                <p>Waiting for agent to initialize...</p>
                            </div>
                        ) : (
                            logs.map((log, idx) => (
                                <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '12px' }}>
                                    <span style={{ color: '#475569', minWidth: '140px' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                    <span style={{
                                        color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'action' ? '#60a5fa' : '#cbd5e1',
                                        fontWeight: log.type === 'error' || log.type === 'success' ? 'bold' : 'normal'
                                    }}>
                                        [{log.component.toUpperCase()}]
                                    </span>
                                    <span style={{ color: log.type === 'error' ? '#fca5a5' : '#f8fafc' }}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        {/* Fake cursor for aesthetic */}
                        {isAgentRunning && <div className="terminal-cursor" style={{ display: 'inline-block', width: '8px', height: '14px', background: '#60a5fa', animation: 'blink 1s step-end infinite', marginTop: '8px' }} />}
                    </div>
                </div>

            </div>
        </div>
    );
};
