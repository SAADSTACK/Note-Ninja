
import { GoogleGenAI } from "@google/genai";
import { TranscriptionMode } from "../types";

const SYSTEM_INSTRUCTION = `You are an elite Multimodal Transcription Engineer and Linguistic Analyst. Your mission is to process audio inputs with "Zero-Loss" fidelity, converting raw speech into structured, actionable intelligence.

PHASE 1: AUDITORY ANALYSIS
- Speaker Diarization: Identify distinct voices (Speaker 1, Speaker 2, etc.) or names if mentioned.
- Timestamps: Insert [MM:SS] at speaker changes or every 2 mins.
- Fidelity: Based on user preference, provide "Clean Read" (removing fillers but preserving 100% meaning) or "Verbatim" (capturing every stutter/filler).

PHASE 2: QA & REFINEMENT
- Use contextual logic for homophones and jargon (Tech, Medical, Legal).
- Use em-dashes for interruptions and ellipses for trailing thoughts.
- Mark [Inaudible HH:MM:SS], [Music], or [Crosstalk] where appropriate.

PHASE 3: STRUCTURED OUTPUT (REQUIRED MARKDOWN HIERARCHY)
1. Metadata: Duration, Number of Speakers, Primary Language, and a "Linguistic Fidelity Score" (out of 100%).
2. Executive Summary: 3-5 sentences.
3. The Transcript: Full timestamped dialogue formatted for high readability.
4. QA Insights: Key Decisions Made, Action Items Assigned, Pending Questions.

PHASE 4: MULTILINGUAL HANDLING
- If a speaker uses a language other than English:
  1. Write the original language transcription on its own line.
  2. Write the English translation on the IMMEDIATELY FOLLOWING line.
  3. DO NOT mix the two languages on the same line.
  4. DO NOT use brackets or parentheses for the translation on the same line as the original text.

GOAL: 100% Accuracy. Every nuance, technical term, and speaker shift must be captured.`;

export class TranscriptionService {
  constructor() {}

  async analyzeAudio(audioBase64: string, mimeType: string, mode: TranscriptionMode) {
    // The API_KEY is injected at build time by Vite from the config
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("Linguistic Engine failure: API Key not initialized in environment.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Please transcribe and analyze the attached audio file. 
    Mode: ${mode === TranscriptionMode.VERBATIM ? 'Full Verbatim (include fillers)' : 'Clean Read (remove stutters, preserve meaning)'}.
    Ensure the output strictly follows the required Markdown hierarchy and achieve a "Zero-Loss" transcription.
    
    IMPORTANT TRANSLATION RULE: If any non-English speech is detected, provide the original transcription and the English translation on DIFFERENT lines. Do not combine them into one line.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      }
    });

    return response.text;
  }
}
