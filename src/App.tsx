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
import type { SavedOutreachIdea } from './components/outreach-ideas/OutreachIdeasView';
import type { SavedIdea } from './components/scanner-ideas/ScannerIdeasView';
import { parseGigRadarText, cleanJobTitle } from './utils/parser';

export type AppState = 'ingestion' | 'results' | 'scanner' | 'data' | 'configurator' | 'scanner-ideas' | 'outreach' | 'outreach-ideas';

function App() {
  const [appState, setAppState] = useState<AppState>('ingestion');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedJobs, setSavedJobs] = useState<ParsedJob[]>([]);
  const [scannerIdeas, setScannerIdeas] = useState<SavedIdea[]>([]);
  const [outreachIdeas, setOutreachIdeas] = useState<SavedOutreachIdea[]>([]);

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
    });
  }, []);

  // Listen for Chrome Extension Syncs to auto-populate the Data Hub
  useEffect(() => {
    const handleExtensionSync = () => {
      try {
        const data = localStorage.getItem('revops_extension_sync');
        if (data) {
          const extensionJobs = JSON.parse(data);

          if (extensionJobs.length > 0) {
            setSavedJobs((prev: ParsedJob[]) => {
              const existingIds = new Set(prev.map(p => p.id));
              let added = false;
              const newJobs = [...prev];

              for (const match of extensionJobs) {
                if (!existingIds.has(match.id)) {
                  const parsed = parseGigRadarText(match.rawText) as ParsedJob;
                  parsed.id = match.id;
                  // Handle potential missing data gracefully
                  parsed.title = cleanJobTitle(match.title || parsed.title || "Unknown Title");
                  parsed.scannerName = match.scannerName || parsed.scannerName || "";
                  parsed.booleanSearch = match.booleanSearch || '';
                  parsed.matchScore = match.isMatch ? 10 : 1; // 10 for match, 1 for rejection
                  parsed.dateIngested = match.dateRecorded || new Date().toISOString();
                  newJobs.unshift(parsed);
                  added = true;

                  // Ship payload to backend
                  fetch('/api/jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed)
                  });
                }
              }

              return added ? newJobs : prev;
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync extension jobs to Data Hub", err);
      }
    };

    window.addEventListener('storage', handleExtensionSync);
    handleExtensionSync(); // Initial load check
    return () => window.removeEventListener('storage', handleExtensionSync);
  }, []);

  useEffect(() => {
    if (window.location.search.includes('view=data')) {
      setAppState('data');
    } else if (window.location.search.includes('view=configurator')) {
      setAppState('configurator');
    } else if (window.location.search.includes('view=scanner-ideas')) {
      setAppState('scanner-ideas');
    } else if (window.location.search.includes('view=outreach-ideas')) {
      setAppState('outreach-ideas');
    } else if (window.location.search.includes('view=outreach')) {
      setAppState('outreach');
    }
  }, []);

  const handleNavigate = (view: AppState) => {
    setAppState(view);
    let newUrl = '/';
    if (view === 'data') newUrl = '?view=data';
    if (view === 'configurator') newUrl = '?view=configurator';
    if (view === 'scanner-ideas') newUrl = '?view=scanner-ideas';
    if (view === 'outreach-ideas') newUrl = '?view=outreach-ideas';
    if (view === 'outreach') newUrl = '?view=outreach';
    if (window.location.search !== newUrl) {
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

    // Also remove from extension sync if it exists there, so it doesn't resurrect on reload
    try {
      const extData = localStorage.getItem('revops_extension_sync');
      if (extData) {
        let extJobs = JSON.parse(extData);
        extJobs = extJobs.filter((j: any) => j.id !== id);
        localStorage.setItem('revops_extension_sync', JSON.stringify(extJobs));
      }
    } catch (err) { }

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

  const resetFlow = () => {
    setAppState('ingestion');
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
        {appState === 'results' && extractedData && (
          <OutputDashboard
            data={extractedData}
            onReset={resetFlow}
          />
        )}
        {appState === 'scanner' && <ScannerView />}
        {appState === 'configurator' && <ConfiguratorView approvedJobs={savedJobs} onDeleteJob={handleDeleteJob} onSaveIdea={handleSaveIdea} />}
        {appState === 'scanner-ideas' && <ScannerIdeasView ideas={scannerIdeas} onDeleteIdea={handleDeleteIdea} />}
        {appState === 'outreach-ideas' && <OutreachIdeasView ideas={outreachIdeas} onDeleteIdea={handleDeleteOutreachIdea} />}
        {appState === 'outreach' && <OutreachView approvedJobs={savedJobs.filter(j => j.matchScore && j.matchScore >= 5)} onIdeaGenerated={handleIdeaGenerated} />}
        {appState === 'data' && <DataView jobs={savedJobs.filter(j => j.matchScore && j.matchScore >= 5)} onDeleteJob={handleDeleteJob} onUpdateJob={handleUpdateJob} />}
      </Layout>
    </div>
  );
}

export default App;
