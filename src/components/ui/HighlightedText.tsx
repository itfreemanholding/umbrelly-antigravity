import React from 'react';

export function parseBooleanQuery(query: string) {
    const terms: string[] = [];
    let cleanedQuery = query;

    if (!cleanedQuery) return terms;

    // 1. Extract Quotes (Exact Phrasing)
    const quoteRegex = /"([^"]+)"/g;
    let match;
    while ((match = quoteRegex.exec(cleanedQuery)) !== null) {
        const escapedPhrase = match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        terms.push(`\\b${escapedPhrase}\\b`);
    }
    // Remove quoted strings so we don't process them again
    cleanedQuery = cleanedQuery.replace(quoteRegex, ' ');

    // 2. Remove Boolean operators: (, ), |
    cleanedQuery = cleanedQuery.replace(/[()|]/g, ' ');

    // 3. Handle explicitly escaped characters like \- and \(
    cleanedQuery = cleanedQuery.replace(/\\-/g, '-');
    cleanedQuery = cleanedQuery.replace(/\\\(/g, '(');
    cleanedQuery = cleanedQuery.replace(/\\\)/g, ')');

    // 4. Split by whitespace and process each word
    const words = cleanedQuery.split(/\s+/).filter(w =>
        w.length > 0 &&
        w.toUpperCase() !== 'AND' &&
        w.toUpperCase() !== 'OR' &&
        w.toUpperCase() !== 'NOT'
    );

    for (let word of words) {
        const isWildcard = word.endsWith('*');
        if (isWildcard) {
            word = word.slice(0, -1);
        }

        // Escape regex special characters in the raw string to prevent crashes
        word = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (word.length === 0) continue;

        if (isWildcard) {
            terms.push(`\\b${word}\\w*`);
        } else {
            terms.push(`\\b${word}\\b`);
        }
    }

    return terms;
}

export function HighlightedText({ text, booleanQuery }: { text: string, booleanQuery?: string }) {
    if (!booleanQuery || !text) return <>{text}</>;

    const terms = parseBooleanQuery(booleanQuery);
    if (terms.length === 0) return <>{text}</>;

    // Sort by length descending to match longest phrases first
    terms.sort((a, b) => b.length - a.length);

    try {
        const regex = new RegExp(`(${terms.join('|')})`, 'gi');
        const chunks = text.split(regex);

        return (
            <React.Fragment>
                {chunks.map((chunk, i) => {
                    if (!chunk) return null;
                    // Provide a background class highlighting correctly
                    if (chunk.match(new RegExp(`^${regex.source}$`, 'i'))) {
                        return <span key={i} style={{ backgroundColor: '#FFEB3B', color: '#000', fontWeight: '500', borderRadius: '2px', padding: '0 2px' }}>{chunk}</span>;
                    }
                    return chunk;
                })}
            </React.Fragment>
        );
    } catch (e) {
        console.warn("Invalid regex generated from boolean query", e);
        return <>{text}</>;
    }
}
