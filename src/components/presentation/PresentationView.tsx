import { useCallback, useEffect, useState } from 'react';
import {
    ShieldCheck,
    LockKeyhole,
    Building2,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    Gift,
    Cloud,
    DollarSign,
    LayoutGrid,
    Network,
    MonitorSmartphone,
    TrendingDown,
    Wrench,
    PiggyBank,
    Star,
    ArrowRight,
    CheckCircle2,
} from 'lucide-react';
import { CloudLogo } from './CloudLogo';
import './PresentationView.css';

/* ------------------------------------------------------------------ */
/*  Small brand chrome pieces reused across slides                     */
/* ------------------------------------------------------------------ */

function Wordmark({ muted = false }: { muted?: boolean }) {
    return (
        <div className={`umb-wordmark ${muted ? 'is-muted' : ''}`}>
            <CloudLogo size={muted ? 22 : 30} muted={muted} />
            <span>Umbrelly</span>
        </div>
    );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="umb-pill">
            <span className="umb-pill-icon">{icon}</span>
            <span>{label}</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Slides                                                             */
/* ------------------------------------------------------------------ */

function SlideTitle() {
    return (
        <div className="umb-slide umb-slide--center">
            <Wordmark />
            <p className="umb-tagline">Cloud Management Platform</p>
            <h1 className="umb-hero-title">
                Save up to <span className="umb-grad">70%</span> on AWS
            </h1>
            <p className="umb-hero-sub">A high-level look at how we cut your cloud bill — without cutting performance.</p>
            <div className="umb-pill-row">
                <FeaturePill icon={<ShieldCheck size={18} />} label="Reliable" />
                <FeaturePill icon={<LockKeyhole size={18} />} label="Secure" />
                <FeaturePill icon={<Building2 size={18} />} label="Built for Enterprise" />
            </div>
        </div>
    );
}

function SlideProblem() {
    const points = [
        { value: '30–40%', label: 'of cloud spend is typically wasted on idle, over-provisioned, or forgotten resources.' },
        { value: 'Opaque', label: 'billing makes it hard to know which teams and workloads drive the bill.' },
        { value: 'No time', label: 'engineering teams are shipping product, not hunting for savings line by line.' },
    ];
    return (
        <div className="umb-slide">
            <Wordmark muted />
            <h2 className="umb-h2">Cloud bills grow faster than anyone plans for</h2>
            <p className="umb-lead">
                As you scale on AWS, cost sprawl compounds quietly. Most teams only notice once the invoice hurts.
            </p>
            <div className="umb-grid umb-grid-3">
                {points.map((p) => (
                    <div className="umb-card umb-card--stat" key={p.value}>
                        <div className="umb-stat-value umb-grad">{p.value}</div>
                        <p className="umb-stat-label">{p.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideNeeds() {
    const cards = [
        { icon: <DollarSign size={22} />, title: 'AWS Spendings', desc: 'Where the money actually goes, month over month.' },
        { icon: <MonitorSmartphone size={22} />, title: 'AWS Planning', desc: 'Roadmap, commitments, and reserved capacity.' },
        { icon: <Network size={22} />, title: 'Account Structure', desc: 'Organizations, SSO, and billing hierarchy.' },
        { icon: <LayoutGrid size={22} />, title: 'Optimization Attempts', desc: "What you've already tried — and what stuck." },
    ];
    return (
        <div className="umb-slide">
            <Wordmark muted />
            <h2 className="umb-h2">What is your cloud&apos;s current status?</h2>
            <p className="umb-lead">We start by understanding four things. No access required to begin the conversation.</p>
            <div className="umb-grid umb-grid-2">
                {cards.map((c) => (
                    <div className="umb-card umb-card--needs" key={c.title}>
                        <span className="umb-needs-icon">{c.icon}</span>
                        <div>
                            <h3 className="umb-card-title">{c.title}</h3>
                            <p className="umb-card-desc">{c.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideInfoRequest() {
    const items = [
        'PDF export of your billing data for last month’s usage',
        'Check your organization structure through screen share',
        'SSO, Identity Center check',
        'Currency, region, taxes',
        'Kubernetes footprint',
        'Other custom questions',
    ];
    return (
        <div className="umb-slide umb-slide--split">
            <div className="umb-split-main">
                <Wordmark muted />
                <h2 className="umb-h2">Information request</h2>
                <p className="umb-lead">A quick, ~15-minute account connection is all we need to confirm real savings.</p>
                <ul className="umb-timeline">
                    {items.map((t) => (
                        <li key={t}>
                            <span className="umb-timeline-dot" />
                            <span>{t}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="umb-split-aside">
                <div className="umb-cloud-illu">
                    <Cloud size={120} strokeWidth={1.5} />
                    <span className="umb-cloud-dot" style={{ opacity: 0.9 }} />
                    <span className="umb-cloud-dot" style={{ opacity: 0.6 }} />
                    <span className="umb-cloud-ring" />
                </div>
            </div>
        </div>
    );
}

function SlideHow() {
    const steps = [
        { n: '01', title: 'Connect', desc: 'Read-only access or a billing export. ~15 minutes, no downtime.' },
        { n: '02', title: 'Analyze', desc: 'Our FinOps engine maps every dollar to a workload and finds the waste.' },
        { n: '03', title: 'Optimize', desc: 'Rightsizing, commitments, and cleanup — applied safely, with you in the loop.' },
        { n: '04', title: 'Report', desc: 'Transparent monthly savings. You only pay on what we actually save.' },
    ];
    return (
        <div className="umb-slide">
            <Wordmark muted />
            <h2 className="umb-h2">How it works</h2>
            <p className="umb-lead">Four steps from first call to a lower bill — and it keeps working every month.</p>
            <div className="umb-grid umb-grid-4">
                {steps.map((s) => (
                    <div className="umb-card umb-card--step" key={s.n}>
                        <span className="umb-step-n">{s.n}</span>
                        <h3 className="umb-card-title">{s.title}</h3>
                        <p className="umb-card-desc">{s.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlidePillars() {
    const pillars = [
        { icon: <TrendingDown size={24} />, title: 'FinOps', desc: 'Cost visibility, rightsizing, Savings Plans & RIs, and anomaly alerts.' },
        { icon: <Wrench size={24} />, title: 'DevOps', desc: 'Infrastructure tuning and automation that holds the savings in place.' },
        { icon: <ShieldCheck size={24} />, title: 'SecOps', desc: 'Identity, guardrails, and account hygiene baked into every change.' },
    ];
    return (
        <div className="umb-slide">
            <Wordmark muted />
            <h2 className="umb-h2">One team across FinOps, DevOps &amp; SecOps</h2>
            <p className="umb-lead">30+ cloud engineers managing $20M+ in annual cloud spend.</p>
            <div className="umb-grid umb-grid-3">
                {pillars.map((p) => (
                    <div className="umb-card umb-card--pillar" key={p.title}>
                        <span className="umb-pillar-icon">{p.icon}</span>
                        <h3 className="umb-card-title">{p.title}</h3>
                        <p className="umb-card-desc">{p.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideSavings() {
    return (
        <div className="umb-slide umb-slide--center umb-slide--savings">
            <div className="umb-savings-head">
                <Wordmark muted />
                <span className="umb-prepared">Example estimate &middot; 28 May 2026</span>
            </div>
            <h2 className="umb-savings-title">
                <span className="umb-grad">&minus;9.14%</span> off every month, your AWS bill drops from{' '}
                <span className="umb-strike-old">$135,226</span> to <span className="umb-amount-new">~$122,860</span>
            </h2>
            <p className="umb-lead umb-lead--center">And to get you started — extras for new accounts:</p>
            <div className="umb-extras">
                <div className="umb-extra">
                    <span className="umb-extra-icon"><PiggyBank size={20} /></span>
                    <div>
                        <strong>$27,000 in AWS credits</strong>
                        <p>Your first 3 months, to fund new initiatives.</p>
                    </div>
                </div>
                <div className="umb-extra">
                    <span className="umb-extra-icon"><Gift size={20} /></span>
                    <div>
                        <strong>Sign-up bonus</strong>
                        <p>Exact terms and how much you get TBD during the demo call.</p>
                    </div>
                </div>
            </div>
            <button className="umb-cta">Book a 30-min call</button>
            <p className="umb-fineprint">
                High-level estimate based on current monthly usage. Not a binding quote — final savings are confirmed after
                a quick (~15-min) account connection. Performance-fee items are charged only on realized savings.
            </p>
        </div>
    );
}

function SlideAbout() {
    const stats = [
        { flag: '\u{1F1FA}\u{1F1F8}', value: 'HQ', label: 'Incorporated and headquartered in Delaware, United States.' },
        { flag: '\u{1F465}', value: '30+', label: 'Cloud talents: DevOps, FinOps & SecOps engineers.' },
        { flag: '\u{1F4B0}', value: '$20M+', label: 'Annual cloud spend under management.' },
        { flag: '⭐', value: '5 / 5', label: 'Reviewed on Product Hunt.' },
    ];
    return (
        <div className="umb-slide">
            <div className="umb-about-head">
                <h2 className="umb-h2" style={{ margin: 0 }}>About us</h2>
                <Wordmark muted />
            </div>
            <div className="umb-grid umb-grid-2">
                {stats.map((s) => (
                    <div className="umb-card umb-card--about" key={s.label}>
                        <span className="umb-about-flag">{s.flag}</span>
                        <div>
                            <span className="umb-about-value">{s.value}</span>
                            <p className="umb-card-desc">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlidePartners() {
    const partners = [
        { name: 'AWS', sub: 'Partner' },
        { name: 'Microsoft', sub: 'Partner' },
        { name: 'Google Cloud', sub: 'Partner' },
    ];
    return (
        <div className="umb-slide umb-slide--center">
            <Wordmark muted />
            <h2 className="umb-h2" style={{ textAlign: 'center' }}>Backed by official cloud partnerships</h2>
            <p className="umb-lead umb-lead--center">
                We work where you already run. Certified across the three major clouds.
            </p>
            <div className="umb-partner-row">
                {partners.map((p) => (
                    <div className="umb-partner-card" key={p.name}>
                        <span className="umb-partner-name">{p.name}</span>
                        <span className="umb-partner-sub">{p.sub}</span>
                    </div>
                ))}
            </div>
            <div className="umb-trust">
                <Star size={16} className="umb-star" /> 5/5 on Product Hunt
            </div>
        </div>
    );
}

function SlideWhy() {
    const reasons = [
        'Pay only on realized savings — incentives fully aligned.',
        'No rip-and-replace: we optimize the AWS you already run.',
        'Security-first changes, reviewed with your team.',
        'Transparent monthly reporting you can hand to finance.',
    ];
    return (
        <div className="umb-slide">
            <Wordmark muted />
            <h2 className="umb-h2">Why teams choose Umbrelly</h2>
            <div className="umb-why-list">
                {reasons.map((r) => (
                    <div className="umb-why-item" key={r}>
                        <CheckCircle2 size={22} className="umb-why-check" />
                        <span>{r}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SlideCTA() {
    return (
        <div className="umb-slide umb-slide--center umb-slide--cta">
            <Wordmark />
            <h2 className="umb-cta-title">Let&apos;s find your savings.</h2>
            <p className="umb-hero-sub">
                A 30-minute call and a ~15-minute account connection is all it takes to see a real number.
            </p>
            <button className="umb-cta">
                Book a 30-min call <ArrowRight size={18} />
            </button>
            <p className="umb-fineprint">team@umbrelly.cloud &middot; UMBRELLY Inc. — Dover, DE 19904, USA</p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Deck                                                               */
/* ------------------------------------------------------------------ */

const SLIDES: { id: string; render: () => React.ReactNode }[] = [
    { id: 'title', render: SlideTitle },
    { id: 'problem', render: SlideProblem },
    { id: 'about', render: SlideAbout },
    { id: 'partners', render: SlidePartners },
    { id: 'needs', render: SlideNeeds },
    { id: 'info', render: SlideInfoRequest },
    { id: 'how', render: SlideHow },
    { id: 'pillars', render: SlidePillars },
    { id: 'savings', render: SlideSavings },
    { id: 'why', render: SlideWhy },
    { id: 'cta', render: SlideCTA },
];

export function PresentationView() {
    const [index, setIndex] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const total = SLIDES.length;

    const go = useCallback(
        (dir: number) => {
            setIndex((i) => Math.min(total - 1, Math.max(0, i + dir)));
        },
        [total]
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                go(1);
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                go(-1);
            } else if (e.key === 'Home') {
                setIndex(0);
            } else if (e.key === 'End') {
                setIndex(total - 1);
            } else if (e.key === 'Escape' && fullscreen) {
                setFullscreen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, total, fullscreen]);

    const Current = SLIDES[index].render;

    return (
        <div className={`umb-deck ${fullscreen ? 'is-fullscreen' : ''}`}>
            <div className="umb-stage">
                {/* dotted brand backdrop */}
                <div className="umb-dots" aria-hidden />

                {/* slide counter chip */}
                <div className="umb-counter">
                    <LayoutGrid size={15} />
                    {index + 1} of {total}
                </div>

                <button
                    className="umb-fs-btn"
                    onClick={() => setFullscreen((f) => !f)}
                    title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
                >
                    {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <div className="umb-slide-frame" key={SLIDES[index].id}>
                    <Current />
                </div>

                <div className="umb-deck-footer">
                    <span>Copyright © 2023–2025 Umbrelly.cloud</span>
                    <span>UMBRELLY Inc., Delaware corporation (No. 365087619)</span>
                </div>

                {/* navigation */}
                <button className="umb-nav umb-nav--prev" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous slide">
                    <ChevronLeft size={22} />
                </button>
                <button className="umb-nav umb-nav--next" onClick={() => go(1)} disabled={index === total - 1} aria-label="Next slide">
                    <ChevronRight size={22} />
                </button>

                {/* progress dots */}
                <div className="umb-progress">
                    {SLIDES.map((s, i) => (
                        <button
                            key={s.id}
                            className={`umb-progress-dot ${i === index ? 'is-active' : ''}`}
                            onClick={() => setIndex(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
