function updateStats() {
    chrome.storage.local.get(['scannedJobs'], (result) => {
        const jobs = result.scannedJobs || [];
        const matches = jobs.filter(j => j.isMatch).length;
        const rejected = jobs.filter(j => !j.isMatch).length;
        document.getElementById('count-matches').innerText = matches;
        document.getElementById('count-rejected').innerText = rejected;
    });
}

function loadProjects() {
    fetch('http://localhost:3001/api/projects')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('project-select');
            select.innerHTML = '';
            
            if (data && data.projects && data.projects.length > 0) {
                data.projects.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name;
                    select.appendChild(opt);
                });
                
                // Restore previous selection or default to active
                chrome.storage.local.get(['activeProjectId'], (res) => {
                    if (res.activeProjectId) {
                        select.value = res.activeProjectId;
                    } else if (data.activeProject) {
                        select.value = data.activeProject;
                        chrome.storage.local.set({ activeProjectId: data.activeProject });
                    }
                });
            } else {
                select.innerHTML = '<option value="">No Projects Found</option>';
            }
        })
        .catch(err => {
            console.error('Failed to fetch projects', err);
            const select = document.getElementById('project-select');
            select.innerHTML = '<option value="">Error connecting to App</option>';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    loadProjects();
    
    document.getElementById('project-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
            chrome.storage.local.set({ activeProjectId: val });
        }
    });
});
