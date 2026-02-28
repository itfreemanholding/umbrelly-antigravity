import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { AppState } from '../../App';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
    currentView: AppState;
    onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
    return (
        <div className="layout-container">
            <Sidebar currentView={currentView} onNavigate={onNavigate} />
            <div className="main-area">
                <Header />
                <main className="content-area fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
