import { useState } from 'react';
import './App.css';
import { Layout } from './components/layout/Layout';
import { IngestionView } from './components/ingestion/IngestionView';
import { ProcessingView } from './components/processing/ProcessingView';
import { OutputDashboard } from './components/output/OutputDashboard';

export type AppState = 'ingestion' | 'processing' | 'results';

function App() {
  const [appState, setAppState] = useState<AppState>('ingestion');
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleDataSubmit = (_data: any) => {
    setAppState('processing');
    // Simulate processing time
    setTimeout(() => {
      setExtractedData({
        needs: ['Cost optimization', 'Performance enhancement', 'Cloud infrastructure audit'],
        context: 'User wants to reduce AWS bill without sacrificing performance.'
      });
      setAppState('results');
    }, 4500);
  };

  const resetFlow = () => {
    setAppState('ingestion');
    setExtractedData(null);
  };

  return (
    <div className="app-container">
      <Layout
        currentView={appState}
        onNavigate={(view) => setAppState(view as AppState)}
      >
        {appState === 'ingestion' && <IngestionView onSubmit={handleDataSubmit} />}
        {appState === 'processing' && <ProcessingView />}
        {appState === 'results' && extractedData && (
          <OutputDashboard
            data={extractedData}
            onReset={resetFlow}
          />
        )}
      </Layout>
    </div>
  );
}

export default App;
