import { useEffect, useState } from 'react';
import { Cpu, Database, Network, Search, Zap } from 'lucide-react';
import './ProcessingView.css';

export function ProcessingView() {
    const [progress, setProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        { name: 'Parsing raw source material...', icon: Database },
        { name: 'Extracting key pain points...', icon: Search },
        { name: 'Identifying persona needs...', icon: Network },
        { name: 'Generating strategic assets...', icon: Cpu }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return p + 1;
            });
        }, 45);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setActiveStep(Math.min(3, Math.floor(progress / 25)));
    }, [progress]);

    return (
        <div className="processing-container fade-in">
            <div className="processing-hero">
                <div className="ai-brain-animation">
                    <div className="glow-orb pulse-glow"></div>
                    <Zap size={64} className="brain-icon text-gradient" />
                </div>
                <h2 className="text-gradient">RevOps Engine Working</h2>
                <p className="subtitle">Analyzing input data and generating multi-channel strategies...</p>
            </div>

            <div className="glass-panel progress-panel">
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}>
                        <div className="progress-glow"></div>
                    </div>
                </div>
                <div className="progress-text">{progress}% Complete</div>

                <div className="steps-container">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === activeStep;
                        const isCompleted = index < activeStep;
                        const isPending = index > activeStep;

                        return (
                            <div
                                key={index}
                                className={`processing-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                            >
                                <div className="step-icon">
                                    <Icon size={20} />
                                </div>
                                <span className="step-name">{step.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
