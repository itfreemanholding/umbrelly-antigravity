import React, { useState, useEffect } from 'react';
import { Activity, Copy, CheckCircle2, Save, Terminal, AlertCircle } from 'lucide-react';
import './TrackingView.css';

export function TrackingView() {
    const [gaId, setGaId] = useState('');
    const [fbId, setFbId] = useState('');
    const [liId, setLiId] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [savedStatus, setSavedStatus] = useState(false);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const projectId = localStorage.getItem('activeProjectId');

    useEffect(() => {
        if (!projectId) return;

        const loadSettings = async () => {
            try {
                const [gaRes, fbRes, liRes] = await Promise.all([
                    fetch('/api/settings/tracking_ga', { headers: { 'x-project-id': projectId } }),
                    fetch('/api/settings/tracking_fb', { headers: { 'x-project-id': projectId } }),
                    fetch('/api/settings/tracking_li', { headers: { 'x-project-id': projectId } })
                ]);
                
                const gaData = await gaRes.json();
                const fbData = await fbRes.json();
                const liData = await liRes.json();

                if (gaData.value) setGaId(gaData.value);
                if (fbData.value) setFbId(fbData.value);
                if (liData.value) setLiId(liData.value);
            } catch (error) {
                console.error('Failed to load tracking settings:', error);
            }
        };
        
        loadSettings();
    }, [projectId]);

    const handleSave = async () => {
        if (!projectId) return;
        setIsSaving(true);
        
        try {
            await Promise.all([
                fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
                    body: JSON.stringify({ key: 'tracking_ga', value: gaId })
                }),
                fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
                    body: JSON.stringify({ key: 'tracking_fb', value: fbId })
                }),
                fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
                    body: JSON.stringify({ key: 'tracking_li', value: liId })
                })
            ]);
            
            setSavedStatus(true);
            setTimeout(() => setSavedStatus(false), 3000);
        } catch (error) {
            console.error('Failed to save tracking settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [id]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const gaCode = gaId ? `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${gaId}');
</script>` : '<!-- Enter your Google Analytics Measurement ID above to generate code -->';

    const fbCode = fbId ? `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fbId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->` : '<!-- Enter your Facebook Pixel ID above to generate code -->';

    const liCode = liId ? `<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "${liId}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script><script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=${liId}&fmt=gif" />
</noscript>
<!-- End LinkedIn Insight Tag -->` : '<!-- Enter your LinkedIn Partner ID above to generate code -->';


    return (
        <div className="tracking-container fade-in-up">
            <div className="tracking-header">
                <div>
                    <h2 className="text-gradient">Website Tracking Hub</h2>
                    <p className="subtitle">Configure tracking pixels for your website (e.g., Framer, Webflow) to monitor traffic and enable remarketing.</p>
                </div>
                <button 
                    className="primary-btn save-btn" 
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : savedStatus ? (
                        <><CheckCircle2 size={16} /> Saved Successfully</>
                    ) : (
                        <><Save size={16} /> Save Settings</>
                    )}
                </button>
            </div>

            <div className="tracking-content">
                {/* Inputs Section */}
                <div className="tracking-inputs panel fade-in-up stagger-1">
                    <h3 className="section-title"><Activity size={18} /> Configuration IDs</h3>
                    <p className="section-desc">Enter your tracking IDs below. The JavaScript snippets will automatically inject these IDs.</p>
                    
                    <div className="input-group">
                        <label>Google Analytics Measurement ID (G-XXXXXXXXXX)</label>
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="G-..."
                            value={gaId}
                            onChange={(e) => setGaId(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Facebook / Meta Pixel ID</label>
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="e.g. 123456789012345"
                            value={fbId}
                            onChange={(e) => setFbId(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>LinkedIn Partner ID (Insight Tag)</label>
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="e.g. 123456"
                            value={liId}
                            onChange={(e) => setLiId(e.target.value)}
                        />
                    </div>

                    <div className="instructions-alert">
                        <AlertCircle size={16} />
                        <div>
                            <strong>Framer Implementation Guide</strong>
                            <p>To install these, go to your Framer project → Settings → Site → Custom Code. Paste these snippets into the <strong>Start of &lt;head&gt; tag</strong> section and hit Publish.</p>
                        </div>
                    </div>
                </div>

                {/* Code Generators Section */}
                <div className="tracking-snippets panel fade-in-up stagger-2">
                    <h3 className="section-title"><Terminal size={18} /> Generated Tracking Snippets</h3>
                    <p className="section-desc">Copy and paste these directly into your website builder's custom code settings.</p>

                    <div className="code-card">
                        <div className="code-header">
                            <span className="code-badge ga">Google Analytics</span>
                            <button className="icon-btn" onClick={() => copyToClipboard(gaCode, 'ga')} title="Copy Code">
                                {copiedStates['ga'] ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />} 
                                <span>CopySnippet</span>
                            </button>
                        </div>
                        <div className="code-body">
                            <pre><code>{gaCode}</code></pre>
                        </div>
                    </div>

                    <div className="code-card">
                        <div className="code-header">
                            <span className="code-badge fb">Facebook Pixel</span>
                            <button className="icon-btn" onClick={() => copyToClipboard(fbCode, 'fb')} title="Copy Code">
                                {copiedStates['fb'] ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />} 
                                <span>CopySnippet</span>
                            </button>
                        </div>
                        <div className="code-body">
                            <pre><code>{fbCode}</code></pre>
                        </div>
                    </div>

                    <div className="code-card">
                        <div className="code-header">
                            <span className="code-badge li">LinkedIn Insight Tag</span>
                            <button className="icon-btn" onClick={() => copyToClipboard(liCode, 'li')} title="Copy Code">
                                {copiedStates['li'] ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />} 
                                <span>CopySnippet</span>
                            </button>
                        </div>
                        <div className="code-body">
                            <pre><code>{liCode}</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

