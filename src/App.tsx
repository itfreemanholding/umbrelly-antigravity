import { useState, useEffect } from 'react';
import './App.css';
import { Layout } from './components/layout/Layout';
import { OutputDashboard } from './components/output/OutputDashboard';
import { ScannerView } from './components/scanner/ScannerView';
import { DataView } from './components/data/DataView';
import type { ParsedJob } from './utils/parser';
import { IngestionView } from './components/ingestion/IngestionView';
import { ConfiguratorView } from './components/configurator/ConfiguratorView';
import { ScannerIdeasView } from './components/scanner-ideas/ScannerIdeasView';
import { OutreachView } from './components/outreach/OutreachView';
import { OutreachIdeasView } from './components/outreach-ideas/OutreachIdeasView';
import { GoogleAdsView } from './components/google-ads/GoogleAdsView';
import { GoogleAdsIdeasView } from './components/google-ads-ideas/GoogleAdsIdeasView';
import { KeywordsView } from './components/keywords/KeywordsView';
import { AgentDashboard } from './components/agent/AgentDashboard';
import { TrackingView } from './components/tracking/TrackingView';
import { RunTestView } from './components/run-test/RunTestView';
import { ScaleView } from './components/scale/ScaleView';
import type { SavedKeyword } from './components/keywords/KeywordsView';
import type { SavedGoogleAdsIdea } from './components/google-ads-ideas/GoogleAdsIdeasView';
import type { SavedOutreachIdea } from './components/outreach-ideas/OutreachIdeasView';
import type { SavedIdea } from './components/scanner-ideas/ScannerIdeasView';
import { cleanJobTitle } from './utils/parser';

export type AppState = 'ingestion' | 'results' | 'scanner' | 'data' | 'configurator' | 'scanner-ideas' | 'outreach' | 'outreach-ideas' | 'google-ads' | 'google-ads-ideas' | 'keywords' | 'agent' | 'tracking' | 'run-test' | 'scale';

function App() {
  const [appState, setAppState] = useState<AppState>('run-test');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedJobs, setSavedJobs] = useState<ParsedJob[]>([]);
  const [scannerIdeas, setScannerIdeas] = useState<SavedIdea[]>([]);
  const [outreachIdeas, setOutreachIdeas] = useState<SavedOutreachIdea[]>([]);
  const [googleAdsIdeas, setGoogleAdsIdeas] = useState<SavedGoogleAdsIdea[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);

  useEffect(() => {
    // --- ONE-TIME SQLITE MIGRATION DEAMON ---
    const migrateLegacyData = async () => {
      let didMigrate = false;

      // 1. Migrate Jobs
      const legacyJobsStr = localStorage.getItem('revops_saved_jobs');
      if (legacyJobsStr) {
        try {
          const lj = JSON.parse(legacyJobsStr);
          if (Array.isArray(lj)) {
            for (const job of lj) {
              await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(job)
              });
            }
          }
          localStorage.removeItem('revops_saved_jobs');
          didMigrate = true;
        } catch (e) { console.error("Legacy job migration error", e); }
      }

      // 2. Migrate Ideas
      const legacyIdeasStr = localStorage.getItem('revops_scanner_ideas');
      if (legacyIdeasStr) {
        try {
          const li = JSON.parse(legacyIdeasStr);
          if (Array.isArray(li)) {
            for (const idea of li) {
              await fetch('/api/ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(idea)
              });
            }
          }
          localStorage.removeItem('revops_scanner_ideas');
          didMigrate = true;
        } catch (e) { console.error("Legacy idea migration error", e); }
      }

      // 3. Migrate Gemini API Key
      const legacyKeyStr = localStorage.getItem('revops_gemini_key');
      if (legacyKeyStr) {
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'revops_gemini_key', value: legacyKeyStr })
          });
          localStorage.removeItem('revops_gemini_key');
          didMigrate = true;
        } catch (e) { console.error("Legacy key migration error", e); }
      }
      return didMigrate;
    };

    // Load initial data from SQLite backend, pausing if a migration is occurring
    migrateLegacyData().then(() => {
      fetch('/api/jobs')
        .then(res => res.json())
        .then(jobs => {
          const migratedJobs = jobs.map((job: any) => {
            const cleanedTitle = cleanJobTitle(job.title);
            const origDesc = (job.description || job.rawText || "").trim();
            const cleanedDesc = origDesc.replace(/^(?:posted\s*)?(?:about\s+|over\s+|almost\s+)?(?:a|an|\d+)\s+(?:second|minute|hour|day|month|year)s?\s+ago\n+/i, '').trim();

            if (cleanedTitle !== job.title || cleanedDesc !== origDesc) {
              const updatedJob = { ...job, title: cleanedTitle, description: cleanedDesc || job.description };
              fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedJob)
              });
              return updatedJob;
            }
            return job;
          });
          setSavedJobs(migratedJobs);
        })
        .catch(console.error);

      fetch('/api/ideas')
        .then(res => res.json())
        .then(ideas => setScannerIdeas(ideas))
        .catch(console.error);

      fetch('/api/outreach-ideas')
        .then(res => res.json())
        .then(ideas => setOutreachIdeas(ideas))
        .catch(console.error);

      fetch('/api/google-ads-ideas')
        .then(res => res.json())
        .then(ideas => setGoogleAdsIdeas(ideas))
        .catch(console.error);

      fetch('/api/keywords')
        .then(res => res.json())
        .then(kws => setSavedKeywords(kws))
        .catch(console.error);
    });
  }, []);

  // Listen for Chrome Extension Syncs to auto-populate the Data Hub
  // Listen for native Chrome Extension Sync events to live-refresh the Data Hub
  useEffect(() => {
    const handleExtensionSync = () => {
      fetch('/api/jobs')
        .then(res => res.json())
        .then(data => setSavedJobs(data))
        .catch(console.error);
    };

    window.addEventListener('revops:reload_jobs', handleExtensionSync);
    return () => window.removeEventListener('revops:reload_jobs', handleExtensionSync);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') as AppState;
    if (view && ['ingestion', 'results', 'scanner', 'data', 'configurator', 'scanner-ideas', 'outreach', 'outreach-ideas', 'google-ads', 'google-ads-ideas', 'keywords', 'agent', 'tracking', 'run-test', 'scale'].includes(view)) {
      setAppState(view);
    }
  }, []);

  const handleNavigate = (view: AppState) => {
    setAppState(view);
    const newUrl = view === 'run-test' ? '/' : `/?view=${view}`;
    if (window.location.search !== (view === 'run-test' ? '' : `?view=${view}`)) {
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleDataSubmit = (job: ParsedJob) => {
    // Save to local database state
    setSavedJobs(prev => [job, ...prev]);
    fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });

    // In a real app, this would be derived from job.rawText or job.description
    setExtractedData({
      needs: ['Cost optimization', 'Performance enhancement', 'Cloud infrastructure audit'],
      context: 'User wants to reduce AWS bill without sacrificing performance.'
    });

    // We do NOT change app state here anymore, keeping user on IngestionView 
    // where the Toast notification will appear.
  };

  const handleDeleteJob = (id: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== id));
    fetch(`/api/jobs/${id}`, { method: 'DELETE' });


    // Dispatch event to app-sync.js so it deletes the job from the true Chrome internal storage
    window.dispatchEvent(new CustomEvent('revops:delete_job', { detail: id }));
  };

  const handleUpdateJob = (updatedJob: ParsedJob) => {
    setSavedJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    fetch(`/api/jobs/${updatedJob.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedJob)
    });
  };

  const handleSaveIdea = (idea: SavedIdea) => {
    setScannerIdeas(prev => [idea, ...prev]);
    fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea)
    });
  };

  const handleDeleteIdea = (id: string) => {
    setScannerIdeas(prev => prev.filter(idea => idea.id !== id));
    fetch(`/api/ideas/${id}`, { method: 'DELETE' });
  };

  const handleIdeaGenerated = (idea: SavedOutreachIdea) => {
    setOutreachIdeas(prev => [idea, ...prev]);
  };

  const handleDeleteOutreachIdea = (id: string) => {
    setOutreachIdeas(prev => prev.filter(idea => idea.id !== id));
    fetch(`/api/outreach-ideas/${id}`, { method: 'DELETE' });
  };

  const handleGoogleAdsIdeaGenerated = (idea: SavedGoogleAdsIdea) => {
    setGoogleAdsIdeas(prev => [idea, ...prev]);
  };

  const handleDeleteGoogleAdsIdea = (id: string) => {
    setGoogleAdsIdeas(prev => prev.filter(idea => idea.id !== id));
    fetch(`/api/google-ads-ideas/${id}`, { method: 'DELETE' });
  };

  const handleDeleteKeyword = (id: string) => {
    setSavedKeywords((prev: SavedKeyword[]) => prev.filter((kw: SavedKeyword) => kw.id !== id));
    fetch(`/api/keywords/${id}`, { method: 'DELETE' });
  };

  const handleAddKeyword = (kw: Omit<SavedKeyword, 'id' | 'dateSaved'>) => {
    const newKw: SavedKeyword = {
      ...kw,
      id: 'kw_' + Date.now(),
      dateSaved: new Date().toISOString()
    };
    setSavedKeywords(prev => [newKw, ...prev]);
    fetch('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKw)
    });
  };

  const resetFlow = () => {
    setAppState('run-test');
    setExtractedData(null);
  };

  return (
    <div className="app-container">
      <Layout
        currentView={appState}
        onNavigate={(view) => handleNavigate(view as AppState)}
      >
        {appState === 'ingestion' && (
          <IngestionView
            onSubmit={handleDataSubmit}
            onNavigateToData={() => handleNavigate('data')}
          />
        )}
        {appState === 'results' && (
          <OutputDashboard
            data={extractedData}
            onReset={resetFlow}
          />
        )}
        {appState === 'scanner' && <ScannerView />}
        {appState === 'configurator' && <ConfiguratorView approvedJobs={savedJobs} onDeleteJob={handleDeleteJob} onSaveIdea={handleSaveIdea} />}
        {appState === 'scanner-ideas' && <ScannerIdeasView ideas={scannerIdeas} onDeleteIdea={handleDeleteIdea} />}
        {appState === 'outreach-ideas' && <OutreachIdeasView ideas={outreachIdeas} onDeleteIdea={handleDeleteOutreachIdea} />}
        {appState === 'keywords' && <KeywordsView keywords={savedKeywords} onDelete={handleDeleteKeyword} onAdd={handleAddKeyword} />}
        {appState === 'outreach' && <OutreachView approvedJobs={savedJobs.filter(j => j.matchScore && j.matchScore >= 5)} onIdeaGenerated={handleIdeaGenerated} />}
        {appState === 'google-ads' && <GoogleAdsView approvedJobs={savedJobs.filter(j => j.matchScore && j.matchScore >= 5)} onIdeaGenerated={handleGoogleAdsIdeaGenerated} />}
        {appState === 'google-ads-ideas' && <GoogleAdsIdeasView ideas={googleAdsIdeas} onDeleteIdea={handleDeleteGoogleAdsIdea} />}
        {appState === 'data' && <DataView jobs={savedJobs.filter(j => j.matchScore && j.matchScore >= 5)} onDeleteJob={handleDeleteJob} onUpdateJob={handleUpdateJob} />}
        {appState === 'agent' && <AgentDashboard />}
        {appState === 'tracking' && <TrackingView />}
        {appState === 'run-test' && <RunTestView />}
        {appState === 'scale' && <ScaleView />}
      </Layout>
    </div>
  );
}

export default App;
