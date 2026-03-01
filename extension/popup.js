function updateStats() {
    chrome.storage.local.get(['scannedJobs'], (result) => {
        const jobs = result.scannedJobs || [];
        const matches = jobs.filter(j => j.isMatch).length;
        const rejected = jobs.filter(j => !j.isMatch).length;
        document.getElementById('count-matches').innerText = matches;
        document.getElementById('count-rejected').innerText = rejected;
    });
}

document.addEventListener('DOMContentLoaded', updateStats);
