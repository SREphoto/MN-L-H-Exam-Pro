

import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveSession, LiveServerMessage } from "@google/genai";
import { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & Chat Models ---

let chat: Chat | null = null;

export const startChat = (history: ChatMessage[]) => {
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })),
    });
};

export const sendMessageToChat = async (message: string): Promise<string> => {
    if (!chat) {
        startChat([]);
    }
    if (chat) {
        const response: GenerateContentResponse = await chat.sendMessage({ message });
        return response.text;
    }
    return "Chat not initialized.";
};

export const getGroundedResponse = async (query: string): Promise<ChatMessage> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return {
        role: 'model',
        text: response.text,
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

export const getDeepDiveAnalysis = async (context: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: context,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });
    return response.text;
};

export const getLowLatencyHint = async (term: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: `Provide a very short, one-sentence mnemonic or simple tip to remember the insurance term: "${term}".`,
    });
    return response.text;
};

export const generateStudyPlan = async (examDate: string, weeklyHours: number): Promise<string> => {
    const prompt = `Create a concise, bulleted study plan for the Minnesota Life & Health insurance exam. The exam date is ${examDate} and I can study ${weeklyHours} hours per week. Break it down week by week. Focus on the main topics: Life Insurance General Knowledge, Accident & Health General Knowledge, and Minnesota-specific regulations.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
}


// --- Audio Models ---

export const textToSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    return base64Audio;
};


export const connectToLiveTutor = (callbacks: {
    onopen: () => void;
    // FIX: Changed message type from `any` to `LiveServerMessage` for type safety.
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}): Promise<LiveSession> => {
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a friendly and encouraging tutor helping a student prepare for the Minnesota Life and Health insurance exam. Keep your answers concise and clear.',
            inputAudioTranscription: {},
            outputAudioTranscription: {}
        },
    });
    return sessionPromise;
};