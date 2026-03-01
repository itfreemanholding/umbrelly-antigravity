import { useState, useEffect } from 'react';
import './App.css';
import { Layout } from './components/layout/Layout';
import { OutputDashboard } from './components/output/OutputDashboard';
import { ScannerView } from './components/scanner/ScannerView';
import { DataView } from './components/data/DataView';
import type { ParsedJob } from './utils/parser';
import { IngestionView } from './components/ingestion/IngestionView';
import { ConfiguratorView } from './components/configurator/ConfiguratorView';
import { parseGigRadarText } from './utils/parser';

export type AppState = 'ingestion' | 'results' | 'scanner' | 'data' | 'configurator';

function App() {
  const [appState, setAppState] = useState<AppState>('ingestion');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedJobs, setSavedJobs] = useState<ParsedJob[]>(() => {
    const localData = localStorage.getItem('revops_saved_jobs');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('revops_saved_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  // Listen for Chrome Extension Syncs to auto-populate the Data Hub
  useEffect(() => {
    const handleExtensionSync = () => {
      try {
        const data = localStorage.getItem('revops_extension_sync');
        if (data) {
          const extensionJobs = JSON.parse(data);
          const matches = extensionJobs.filter((j: any) => j.isMatch);

          if (matches.length > 0) {
            setSavedJobs((prev: ParsedJob[]) => {
              const existingIds = new Set(prev.map(p => p.id));
              let added = false;
              const newJobs = [...prev];

              for (const match of matches) {
                if (!existingIds.has(match.id)) {
                  const parsed = parseGigRadarText(match.rawText) as ParsedJob;
                  parsed.id = match.id;
                  parsed.title = match.title || parsed.title;
                  parsed.scannerName = match.scannerName || parsed.scannerName;
                  parsed.booleanSearch = match.booleanSearch || '';
                  parsed.matchScore = 10; // Explicit match from extension is a 10
                  parsed.dateIngested = match.dateRecorded || new Date().toISOString();
                  newJobs.unshift(parsed);
                  added = true;
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
    }
  }, []);

  const handleNavigate = (view: AppState) => {
    setAppState(view);
    let newUrl = '/';
    if (view === 'data') newUrl = '?view=data';
    if (view === 'configurator') newUrl = '?view=configurator';
    if (window.location.search !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  };

  const handleDataSubmit = (job: ParsedJob) => {
    // Save to local database state
    setSavedJobs(prev => [job, ...prev]);

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
        {appState === 'configurator' && <ConfiguratorView />}
        {appState === 'data' && <DataView jobs={savedJobs} onDeleteJob={handleDeleteJob} onUpdateJob={handleUpdateJob} />}
      </Layout>
    </div>
  );
}

export default App;
