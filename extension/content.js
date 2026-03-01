// RevOps Data Catcher - Inline DOM Injector

function getScannerName() {
    // Top-level heading element (the red box in screenshot)
    const headings = Array.from(document.querySelectorAll('h1, h2, div.ant-typography, span.ant-typography'));
    // Usually the largest, closest heading at the top of the GigRadar scanner panel
    for (let h of headings) {
        const text = h.innerText || '';
        if (text.length > 3 && h.tagName === 'H1') {
            return text.trim();
        }
    }

    // Fallback: Check for generic title classes that look like large headings
    for (let h of headings) {
        const text = h.innerText || '';
        if (text.length > 3 && (text.toLowerCase().includes('copy of') || h.className.toLowerCase().includes('title'))) {
            return text.trim();
        }
    }

    return 'Unknown Scanner';
}

function getBooleanSearch() {
    // 1. The Green Box in the screenshot - it is an input field, often bordered, beneath the scanner name
    const inputs = Array.from(document.querySelectorAll('input.ant-input'));
    let bestMatch = '';

    // The boolean search is the input that typically has the most text or explicit boolean characters.
    // However, if the user explicitly showed it's the second input, or the one containing the query...
    for (let input of inputs) {
        const val = input.value || '';
        // If it looks like a boolean query OR it's just a long string (like "real estate platform")
        if (val.length > 5 && (val.includes('(') || val.includes('|') || val.includes('"') || val.includes('AND') || val.includes('OR'))) {
            return val;
        }
    }

    // Fallback: Grabbing the value of the most populated text input that IS NOT a tiny search bar
    let longestInput = '';
    for (let input of inputs) {
        const val = input.value || '';
        if (val.length > longestInput.length) {
            longestInput = val;
        }
    }

    if (longestInput.length > 3) {
        return longestInput;
    }

    // 3. Fallback: Search ALL inputs if the specific class failed
    const allInputs = Array.from(document.querySelectorAll('input, textarea'));
    for (let input of allInputs) {
        const val = input.value || '';
        if (val.length > 5 && (val.includes('(') || val.includes('|') || val.includes('"'))) {
            return val;
        }
    }

    return 'Unknown Query';
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

// Inject global styles exactly once for button hover states
if (!document.getElementById('revops-ext-styles')) {
    const style = document.createElement('style');
    style.id = 'revops-ext-styles';
    style.innerHTML = `
        .revops-btn-match {
            background: #10b981 !important;
            color: white !important;
            border: none !important;
            padding: 10px 24px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2) !important;
        }
        .revops-btn-match:hover {
            background: #059669 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3) !important;
        }
        .revops-btn-no-match {
            background: white !important;
            color: #ef4444 !important;
            border: 1.5px solid #ef4444 !important;
            padding: 9px 24px !important; /* Adjusted for border */
            border-radius: 6px !important;
            cursor: pointer !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            transition: all 0.2s ease !important;
        }
        .revops-btn-no-match:hover {
            background: #fef2f2 !important;
            color: #dc2626 !important;
            border-color: #dc2626 !important;
            transform: translateY(-1px) !important;
        }
    `;
    document.head.appendChild(style);
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
        actionBar.style.cssText = 'display: flex; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; align-items: center; justify-content: flex-end; z-index: 10; width: 100%;';

        actionBar.innerHTML = `
            <span class="revops-status" style="margin-right: auto; font-size: 14px; font-weight: 600; font-family: system-ui, sans-serif;"></span>
            <button class="revops-btn-no-match">No Match</button>
            <button class="revops-btn-match">Match</button>
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
                scannerName: getScannerName(),
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
