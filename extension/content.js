// RevOps Data Catcher - Inline DOM Injector

function getBooleanSearch() {
    // Exact GigRadar Search Bar Input Class
    const mainInput = document.querySelector('input.ant-input.ant-input-lg.ant-input-borderless');
    if (mainInput && mainInput.value && mainInput.value.length > 2) {
        return mainInput.value;
    }

    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    let bestMatch = '';

    // Look for inputs containing typical boolean operators or quotes
    for (let input of inputs) {
        const val = input.value || '';
        if (val.length > 3 && (val.includes('(') || val.includes('"') || val.includes('|') || val.includes('*'))) {
            bestMatch = val;
            break;
        }
    }

    // Fallback: check DOM for the active scanner title if the input isn't found
    if (!bestMatch) {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, div[class*="title"], span[class*="title"]'));
        for (let h of headings) {
            const text = h.innerText || '';
            if (text.length > 3 && (text.includes('"') || text.includes('('))) {
                bestMatch = text.trim();
                break;
            }
        }
    }
    return bestMatch || 'Unknown Query';
}

function saveJob(jobData, isMatch, statusEl) {
    jobData.isMatch = isMatch;

    chrome.runtime.sendMessage({ type: 'SAVE_JOB', job: jobData }, (response) => {
        if (response && response.success) {
            statusEl.innerText = '✅ Saved';
            statusEl.style.color = '#10b981';
        } else {
            statusEl.innerText = '❌ Error';
            statusEl.style.color = '#ef4444';
        }
        setTimeout(() => { statusEl.innerText = ''; }, 2000);
    });
}

function addButtonsToJobs() {
    // Look for recognizable metrics text that exists at the bottom of GigRadar cards
    const texts = Array.from(document.querySelectorAll('span, div, p')).filter(el => {
        const t = (el.innerText || '').replace(/\s+/g, ' ');
        return t.includes('GigRadar Score') || t.includes('Total Spent') || t.includes('Avg Rate Paid');
    });

    // Find the Ant Design card container
    const cards = new Set();
    texts.forEach(el => {
        const card = el.closest('.ant-card');
        if (card && card.innerText.length > 100 && card.innerText.length < 5000) {
            cards.add(card);
        }
    });

    cards.forEach(card => {
        if (card.querySelector('.revops-inline-actions') || card.dataset.revopsProcessed) {
            card.dataset.revopsProcessed = "true";
            return;
        }

        card.dataset.revopsProcessed = "true";

        // Create action bar
        const actionBar = document.createElement('div');
        actionBar.className = 'revops-inline-actions';
        actionBar.style.cssText = 'display: flex; gap: 16px; margin-top: 24px; margin-bottom: 8px; align-items: center; justify-content: flex-start; z-index: 10; width: 100%;';

        actionBar.innerHTML = `
            <button class="revops-btn-match" style="background: #00ff00; color: white; border: none; padding: 12px 32px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px; font-family: sans-serif; transition: transform 0.1s; box-shadow: 0 4px 6px rgba(0, 255, 0, 0.3); text-align: center;">Match</button>
            <button class="revops-btn-no-match" style="background: white; color: #ff0000; border: 3px solid #ff0000; padding: 10px 32px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px; font-family: sans-serif; transition: transform 0.1s; text-align: center;">No Match</button>
            <span class="revops-status" style="margin-left: 16px; font-size: 16px; font-weight: bold; font-family: sans-serif;"></span>
        `;

        const extractJobData = () => {
            const headings = card.querySelectorAll('h1, h2, h3, h4, a[href*="job"]');
            let title = 'Unknown Position';
            if (headings.length > 0) {
                title = headings[0].innerText.trim();
            } else {
                const lines = card.innerText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) title = lines[0];
            }

            return {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                title: title,
                rawText: card.innerText,
                booleanSearch: getBooleanSearch(),
                dateRecorded: new Date().toISOString()
            };
        };

        actionBar.querySelector('.revops-btn-match').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveJob(extractJobData(), true, actionBar.querySelector('.revops-status'));
            actionBar.style.borderColor = '#10b981';
            actionBar.style.backgroundColor = '#ecfdf5';
        });

        actionBar.querySelector('.revops-btn-no-match').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveJob(extractJobData(), false, actionBar.querySelector('.revops-status'));
            actionBar.style.borderColor = '#ef4444';
            actionBar.style.backgroundColor = '#fef2f2';
        });

        // Append to the bottom of the card
        card.appendChild(actionBar);
    });
}

// Run continually to combat React DOM rewrites
setInterval(addButtonsToJobs, 1500);
