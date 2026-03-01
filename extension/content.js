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
    // 1. The Green Box in the screenshot - it is the SECOND input field, beneath the scanner name
    const inputs = Array.from(document.querySelectorAll('input.ant-input'));

    // Based on the user's screenshot, if there are multiple inputs, the second one is the boolean search
    if (inputs.length >= 2) {
        const val = inputs[1].value || '';
        if (val.length > 0) {
            return val;
        }
    }

    let bestMatch = '';

    // Fallback 1: Look through all ant-inputs for typical boolean operators just in case the layout changed
    for (let input of inputs) {
        const val = input.value || '';
        if (val.length > 5 && (val.includes('(') || val.includes('|') || val.includes('"') || val.includes('AND') || val.includes('OR'))) {
            return val;
        }
    }

    // Fallback 2: Grabbing the value of the most populated text input that IS NOT a tiny search bar
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

    // Fallback 3: Search ALL inputs if the specific class failed
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

        const extractJobData = (callback) => {
            // Find and click any "Expand" or "More" buttons to reveal full text before extracting
            const expandButtons = Array.from(card.querySelectorAll('*')).filter(el => {
                const text = el.innerText || '';
                return (text.trim() === 'Expand' || text.trim() === 'More...') &&
                    (el.tagName === 'A' || el.tagName === 'SPAN' || el.tagName === 'BUTTON');
            });

            if (expandButtons.length > 0) {
                try {
                    expandButtons[0].click();
                } catch (e) {
                    console.log("Could not click expand button", e);
                }
            }

            // Small delay to let React render the expanded text
            setTimeout(() => {
                const headings = card.querySelectorAll('h1, h2, h3, h4, a[href*="job"]');
                let title = 'Unknown Position';
                if (headings.length > 0) {
                    title = headings[0].innerText.trim();
                } else {
                    const lines = card.innerText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length > 0) title = lines[0];
                }

                // Aggressively strip trailing upwork timestamps
                title = title.replace(/(?:\s*[-,|]?\s*)(?:Posted\s*)?(?:about\s+|over\s+|almost\s+)?(?:a|an|\d+)\s+(?:second|minute|hour|day|month|year)s?\s+ago[\s\S]*$/i, '').trim();
                title = title.replace(/(?:\s*[-,|]?\s*)(?:just now|today|yesterday)[\s\S]*$/i, '').trim();

                callback({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    title: title,
                    rawText: card.innerText,
                    scannerName: getScannerName(),
                    booleanSearch: getBooleanSearch(),
                    dateRecorded: new Date().toISOString()
                });
            }, 100); // 100ms should be enough for a local DOM expansion
        };

        actionBar.querySelector('.revops-btn-match').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const statusEl = actionBar.querySelector('.revops-status');
            statusEl.innerText = 'Extracting...';
            extractJobData((jobData) => {
                saveJob(jobData, true, statusEl);
            });
            actionBar.style.borderColor = '#10b981';
            actionBar.style.backgroundColor = '#ecfdf5';
        });

        actionBar.querySelector('.revops-btn-no-match').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const statusEl = actionBar.querySelector('.revops-status');
            statusEl.innerText = 'Extracting...';
            extractJobData((jobData) => {
                saveJob(jobData, false, statusEl);
            });
            actionBar.style.borderColor = '#ef4444';
            actionBar.style.backgroundColor = '#fef2f2';
        });

        // Append to the bottom of the card
        card.appendChild(actionBar);
    });
}

// Run continually to combat React DOM rewrites
setInterval(addButtonsToJobs, 1500);
