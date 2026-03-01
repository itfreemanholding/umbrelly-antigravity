// app-sync.js
// This script runs in the context of the RevOps web app (localhost:5174)
// It serves as a bridge, automatically injecting the extension's database into the app's localStorage so the UI updates in real-time.

function syncToApp() {
    chrome.storage.local.get(['scannedJobs'], (result) => {
        const jobs = result.scannedJobs || [];
        // Inject directly into the app's localStorage
        window.localStorage.setItem('revops_extension_sync', JSON.stringify(jobs));
        // Dispatch a storage event so React state can update in real time
        window.dispatchEvent(new Event('storage'));
    });
}

// Initial sync on load
syncToApp();

// Sync when background script says there's a new job
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SYNC_NOW') {
        syncToApp();
    }
});

// Listen for deletes originating from the React App UI
window.addEventListener('revops:delete_job', (e) => {
    const jobId = e.detail;
    chrome.storage.local.get(['scannedJobs'], (result) => {
        const jobs = result.scannedJobs || [];
        const newJobs = jobs.filter(j => j.id !== jobId);
        chrome.storage.local.set({ scannedJobs: newJobs }, () => {
            // We intentionally do not call syncToApp() here to avoid a React render loop,
            // because the React app already deleted it locally. We just synced Chrome.
        });
    });
});
