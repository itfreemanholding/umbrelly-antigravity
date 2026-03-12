import { useState } from 'react';
import { Mail, Megaphone, Share2, Youtube, RefreshCw, ChevronRight, Copy, CheckCircle2 } from 'lucide-react';
import './OutputDashboard.css';

interface OutputDashboardProps {
    data?: any;
    onReset: () => void;
}

export function OutputDashboard({ data, onReset }: OutputDashboardProps) {
    const [activeCategory, setActiveCategory] = useState<'outreach' | 'ads' | 'social' | 'youtube'>('outreach');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const categories = [
        { id: 'outreach', label: 'Outreach Sequences', icon: Mail, color: 'var(--accent-primary)' },
        { id: 'ads', label: 'Paid Ads', icon: Megaphone, color: '#f59e0b' },
        { id: 'social', label: 'Social Content', icon: Share2, color: 'var(--accent-secondary)' },
        { id: 'youtube', label: 'YouTube Scripts', icon: Youtube, color: '#ef4444' }
    ];

    const handleCopy = (index: number) => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const getActiveContent = () => {
        switch (activeCategory) {
            case 'outreach':
                return [
                    {
                        title: 'Cold Email: The "Performance First" Angle',
                        content: `Subject: Quick question about your AWS spend...

Hi {{Name}},

Noticed you're scaling your SaaS on AWS. Many teams in your space hit a wall where computing costs outpace revenue growth, especially with unoptimized EC2 and RDS instances.

We recently helped a similar platform cut their $8k/mo bill by 22% just through architectural tweaks—without touching reserved instances or hurting performance. 

Open to a quick 10-min chat to see if we can identify similar quick wins for you?`
                    },
                    {
                        title: 'LinkedIn InMail: The Audit Offer',
                        content: `Hi {{Name}}, I see you're leading engineering at {{Company}}. Managing cloud costs while maintaining 99.9% uptime is a tough balancing act. We specialize in non-disruptive AWS cost optimization. Would you be open to a complimentary high-level audit of your architecture?`
                    }
                ];
            case 'ads':
                return [
                    {
                        title: 'LinkedIn Single Image Ad',
                        content: `Primary Text: Paying too much for AWS? 📉 Stop wasting budget on over-provisioned infrastructure. Our RevOps engineers find an average of 30% savings within 14 days. Performance guaranteed. 

Headline: Slash Your AWS Bill Without Code Changes.
CTA: Learn More`
                    }
                ];
            case 'social':
                return [
                    {
                        title: 'Twitter / X Thread Hook',
                        content: `1/ 🚨 Stop buying AWS Reserved Instances before doing this ONE thing...

If you're spending >$1k/mo on AWS, you're likely wasting 20% on "zombie" resources.

Here's a 3-step audit you can run today to save thousands:`
                    }
                ];
            case 'youtube':
                return [
                    {
                        title: 'YouTube Short: AWS Cost Traps',
                        content: `[Hook] Are you paying the "AWS ignorance tax"? (Point at camera)
[0:03] Most SaaS founders don't realize their default VPC and NAT gateway settings are draining hundreds of dollars a month.
[0:08] Here's a quick fix: Check your data transfer costs. If you're routing internal traffic through the public internet, you're bleeding cash.
[0:15] Switch to VPC endpoints instead. It takes 10 minutes and saves literal thousands.
[0:22] Subscribe for more cloud infrastructure growth hacks!`
                    }
                ];
            default:
                return [];
        }
    };

    return (
        <div className="output-container fade-in-up">
            <div className="output-header">
                <div>
                    <h2 className="text-gradient">Generated Assets</h2>
                    {data && data.needs ? (
                        <p className="subtitle">Extracted Needs: {data.needs.join(', ')}</p>
                    ) : (
                        <p className="subtitle">Example outreach and marketing assets for your campaigns.</p>
                    )}
                </div>
                <button className="secondary-btn" onClick={onReset}>
                    <RefreshCw size={16} />
                    Start New Analysis
                </button>
            </div>

            <div className="output-layout">
                <div className="category-sidebar">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                className={`category-btn ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id as any)}
                            >
                                <div className="cat-icon" style={{
                                    background: isActive ? cat.color : 'var(--bg-tertiary)',
                                    color: isActive ? 'white' : 'var(--text-muted)'
                                }}>
                                    <Icon size={18} />
                                </div>
                                <span>{cat.label}</span>
                                {isActive && <ChevronRight size={16} className="active-arrow" />}
                            </button>
                        );
                    })}
                </div>

                <div className="content-display">
                    <div className="glass-panel items-list">
                        {getActiveContent().map((item, idx) => (
                            <div key={idx} className="asset-card stagger-1">
                                <div className="asset-header">
                                    <h3>{item.title}</h3>
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleCopy(idx)}
                                        title="Copy to clipboard"
                                    >
                                        {copiedIndex === idx ? <CheckCircle2 size={18} color="var(--success)" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="asset-body">
                                    {item.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
