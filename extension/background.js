chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_JOB') {
        chrome.storage.local.get(['scannedJobs'], (result) => {
            const jobs = result.scannedJobs || [];
            jobs.push(message.job);
            chrome.storage.local.set({ scannedJobs: jobs }, () => {
                sendResponse({ success: true });
                // Tell any open localhost tabs to sync
                chrome.tabs.query({ url: "http://localhost:5174/*" }, (tabs) => {
                    for (let tab of tabs) {
                        chrome.tabs.sendMessage(tab.id, { type: 'SYNC_NOW' });
                    }
                });
            });
        });
        return true; // Indicates async response
    }
});
