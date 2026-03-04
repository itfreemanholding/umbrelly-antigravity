import type { ParsedJob } from './parser';

const MODEL_NAME = 'gemini-3.1-pro-high'; // Updated to Gemini 3.1 Pro High

export interface GeminiStrategy {
    requiredTerms: string[];
    orGroups: string[][];
}

export async function generateWithGemini(
    apiKey: string,
    baseBoolean: string,
    approvedJobs: ParsedJob[],
    rejectedJobs: any[],
    previouslyGenerated: string[] = [],
    customConstraint: string = ""
): Promise<GeminiStrategy[]> {
    if (!apiKey) throw new Error("API Key is required");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert Boolean Search Strategist for Upwork job feeds.
I need you to generate 5 highly targeted, extremely precise boolean search arrays.

BASE_QUERY: ${baseBoolean}

Your Goal: Produce 5 WILDLY DIFFERENT variations of boolean logic using AND, OR (|), parenthesis (), and exact match quotes ("") that include almost 100% of my Approved Jobs and exclude 100% of my Rejected Jobs.
- Strategy 1, 2, and 3 should build upon or use the BASE_QUERY terminology.
- CRITICAL REQUIREMENT FOR STRATEGIES 4 AND 5: Strategy 4 and 5 MUST be completely fresh, out-of-the-box ideas that DO NOT use the BASE_QUERY keywords at all. They must rely on entirely different technologies, synonyms, or contextual phrases found in the Approved Jobs. ${customConstraint ? `\nCRITICAL USER INSTRUCTION FOR STRAT 4 & 5: ${customConstraint}` : ''}
Focus on highly specific keywords, tech stacks, or negative exclusions based on the provided text.
Use the asterisk (*) for wildcard variations ONLY at the end of words (e.g. optimi*).
NEVER suggest stop words, dates, or time phrases (e.g., "days ago").

${previouslyGenerated.length > 0 ? `CRITICAL CONSTRAINT - STOP AND READ: You MUST invent completely new approaches. 
Do NOT generate anything similar to these previously tried queries:
${previouslyGenerated.map(q => `- ${q}`).join('\n')}

I am REJECTING these past attempts. You must look for entirely different keywords, different negative constraints, or different combinations that you haven't tried yet.` : ''}

APPROVED JOBS (${approvedJobs.length}):
${approvedJobs.map(j => `- TITLE: ${j.title}\n  DESC: ${j.description?.substring(0, 300)}...`).join('\n\n')}

REJECTED JOBS (${rejectedJobs.length}):
${rejectedJobs.map(j => `- TITLE: ${j.title}\n  DESC: ${j.rawText?.substring(0, 300)}...`).join('\n\n')}

Output Format: Provide EXACTLY a valid JSON array containing exactly 5 strategy objects. Only output the JSON array, no markdown blocks, no other text.
Each strategy object must match this interface:
{
  "requiredTerms": string[], // terms/phrases that MUST be present (e.g. ["\"cloud cost\"", "optimization"])
  "orGroups": string[][]     // groups of terms where AT LEAST ONE must be present (e.g. [["aws", "azure", "gcp"], ["prevent", "reduce"]])
}

Example Output:
[
  {
    "requiredTerms": ["\"cloud cost\""],
    "orGroups": [["optimization", "prevent", "reduce"], ["aws", "azure"]]
  }
]
`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 1.5, // Increased for maximum creativity
                maxOutputTokens: 1024
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
        throw new Error("No text returned from Gemini API");
    }

    try {
        const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        }
        throw new Error("Invalid output array shape");
    } catch (e) {
        console.error("Failed to parse Gemini JSON output:", textOutput);
        throw new Error("Failed to parse generated strategies from AI. Please try again.");
    }
}

export async function generateOutreachSequence(
    approvedJobs: ParsedJob[],
    promptOptionId: string,
    customPrompt: string,
    apiKeyInput: string = ""
): Promise<string> {
    const apiKey = apiKeyInput || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Please provide a Gemini API Key to generate sequences.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    let strategyInstruction = "";
    if (promptOptionId === "direct") {
        strategyInstruction = "Write a Direct Pitch sequence. Get straight to the point, highlighting immediate ROI and concrete value propositions based on their technical stack.";
    } else if (promptOptionId === "audit") {
        strategyInstruction = "Write a Free Audit Offer sequence. Take a value-first approach, offering a micro-consultation or technical audit to review their specific architecture.";
    } else if (promptOptionId === "pain") {
        strategyInstruction = "Write a Pain Point Agitation sequence. Deeply emphasize the technical struggles and scaling bottlenecks implied by their job descriptions before introducing our solution.";
    }

    const prompt = `You are an elite B2B tech sales copywriter.
I run a specialized agency that solves complex technical problems for companies looking to hire on Upwork.
Here is a dataset of ${approvedJobs.length} "Approved Matches"—these are exact job postings from our ideal target clients.

YOUR TASK:
Analyze all the provided job descriptions to identify the underlying technical pain points, bottlenecks, and specific technologies these companies are struggling with.
Then, generate a short 3-step cold email Outreach Sequence (Email 1: Initial Pitch, Email 2: Follow-up/Value Add, Email 3: Breakup) tailored to solve these exact problems.

STRATEGY DIRECTIVE:
${strategyInstruction}

ADDITIONAL CUSTOM USER INSTRUCTIONS:
${customPrompt || "None"}

APPROVED JOBS TO ANALYZE:
${approvedJobs.map(j => `- TITLE: ${j.title}\n  DESC: ${j.description?.substring(0, 400)}...`).join('\n\n')}

Format the output cleanly in standard Markdown with headers for each email. Do not include JSON. Ensure the tone is professional, authoritative, but conversational B2B tech sales.`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7, // Good balance for copywriting
                maxOutputTokens: 2048
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
        throw new Error("No text returned from Gemini API");
    }

    return textOutput;
}
