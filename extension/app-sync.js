// app-sync.js
// This script runs in the context of the RevOps web app (localhost:5174)
// It serves as a bridge, notifying the React app to reload data when the extension successfully scrapes a job.

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SYNC_NOW') {
        window.dispatchEvent(new Event('revops:reload_jobs'));
    }
});

// Listen for deletes originating from the React App UI to keep local storage clean
window.addEventListener('revops:delete_job', (e) => {
    const jobId = e.detail;
    chrome.storage.local.get(['scannedJobs'], (result) => {
        const jobs = result.scannedJobs || [];
        const newJobs = jobs.filter(j => j.id !== jobId);
        chrome.storage.local.set({ scannedJobs: newJobs });
    });
});
