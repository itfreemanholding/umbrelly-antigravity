import { useState, useEffect } from 'react';
import './App.css';
import { Layout } from './components/layout/Layout';
import { OutputDashboard } from './components/output/OutputDashboard';
import { ScannerView } from './components/scanner/ScannerView';
import { DataView } from './components/data/DataView';
import type { ParsedJob } from './utils/parser';
import { IngestionView } from './components/ingestion/IngestionView';
import { ConfiguratorView } from './components/configurator/ConfiguratorView';

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
