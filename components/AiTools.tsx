
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AiToolMode, ChatMessage } from '../types';
import { sendMessageToChat, getGroundedResponse, startChat, connectToLiveTutor } from '../services/geminiService';
import { BotIcon, SearchIcon, MessageCircleIcon, MicIcon, MicOffIcon } from './icons';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
import { LiveServerMessage, LiveSession, Blob } from '@google/genai';

// --- CHAT COMPONENTS ---

interface ChatInterfaceProps {
    initialMessage: ChatMessage;
    sendMessage: (message: string) => Promise<ChatMessage | { text: string }>;
    mode: AiToolMode;
    icon: React.ReactNode;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialMessage, sendMessage, mode, icon }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (mode === AiToolMode.Chatbot) {
            startChat([]);
        }
        setMessages([initialMessage]);
    }, [mode, initialMessage]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendMessage(currentInput);
            const modelMessage: ChatMessage = { 
                role: 'model', 
                text: response.text, 
                groundingChunks: (response as ChatMessage).groundingChunks || []
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="p-2 bg-slate-200 rounded-full">{icon}</div>}
                        <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
                           <p className="whitespace-pre-wrap">{msg.text}</p>
                           {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                               <div className="mt-2 border-t pt-2">
                                   <p className="text-xs font-semibold mb-1">Sources:</p>
                                   {msg.groundingChunks.map((chunk, i) => (
                                       chunk.web ? (
                                           <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block truncate">
                                                {chunk.web.title}
                                            </a>
                                       ) : null
                                   ))}
                               </div>
                           )}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-200 rounded-full">{icon}</div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 pt-4 border-t">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="w-full pl-4 pr-12 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Moved initial messages outside components to ensure stable object references
const regulatoryInitialMessage: ChatMessage = { role: 'model', text: 'Ask me any questions about Minnesota insurance regulations. I will use Google Search to find the most up-to-date information.' };
const chatbotInitialMessage: ChatMessage = { role: 'model', text: 'Hello! I am a general chatbot. Ask me anything to help you with your studies.' };

const RegulatoryQnA: React.FC = () => (
    <ChatInterface
        mode={AiToolMode.Regulatory}
        initialMessage={regulatoryInitialMessage}
        sendMessage={getGroundedResponse}
        icon={<SearchIcon className="w-5 h-5 text-slate-600" />}
    />
);

const GeneralChatbot: React.FC = () => (
     <ChatInterface
        mode={AiToolMode.Chatbot}
        initialMessage={chatbotInitialMessage}
        sendMessage={async (message: string) => {
            const text = await sendMessageToChat(message);
            return { text };
        }}
        icon={<MessageCircleIcon className="w-5 h-5 text-slate-600" />}
    />
);


// --- VOICE TUTOR COMPONENT ---

const AiTutor: React.FC = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [status, setStatus] = useState('Idle. Click the mic to start.');
    const [transcriptions, setTranscriptions] = useState<{ user: string; model: string }[]>([]);
    
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const cleanup = useCallback(() => {
        console.log('Cleaning up resources...');
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current?.disconnect();
        mediaStreamSourceRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';

    }, []);

    const startTutorSession = useCallback(async () => {
        setStatus('Initializing...');
        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            sessionPromiseRef.current = connectToLiveTutor({
                onopen: () => {
                    setStatus('Connected. Speak now!');
                    if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                    
                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }

                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session) => {
                           session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscription.current += message.serverContent.inputTranscription.text;
                    }
                     if (message.serverContent?.outputTranscription) {
                        currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                    }
                    if (message.serverContent?.turnComplete) {
                        const userInput = currentInputTranscription.current;
                        const modelOutput = currentOutputTranscription.current;
                        if(userInput || modelOutput) {
                            setTranscriptions(prev => [...prev, {user: userInput, model: modelOutput}]);
                        }
                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Session error:", e);
                    setStatus('Error connecting. Please try again.');
                    cleanup();
                    setIsSessionActive(false);
                },
                onclose: () => {
                    console.log('Session closed.');
                    setStatus('Session ended. Click the mic to start again.');
                    cleanup();
                    setIsSessionActive(false);
                },
            });
            await sessionPromiseRef.current;
            setIsSessionActive(true);
        } catch (error) {
            console.error("Failed to start tutor session:", error);
            setStatus('Could not start session. Check microphone permissions.');
            cleanup();
            setIsSessionActive(false);
        }
    }, [cleanup]);

    const handleToggleSession = useCallback(() => {
        if (isSessionActive) {
            setStatus('Stopping...');
            cleanup();
            setIsSessionActive(false);
        } else {
            startTutorSession();
        }
    }, [isSessionActive, cleanup, startTutorSession]);
    
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex flex-col items-center">
            <p className="text-sm text-slate-500 mb-4">{status}</p>
            <button
                onClick={handleToggleSession}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
                {isSessionActive ? <MicOffIcon className="w-10 h-10 text-white" /> : <MicIcon className="w-10 h-10 text-white" />}
            </button>
            <div className="mt-6 w-full h-[40vh] overflow-y-auto border-t pt-4 space-y-4">
                 {transcriptions.length === 0 && (
                    <p className="text-center text-slate-400">Your conversation will appear here.</p>
                 )}
                 {transcriptions.map((turn, index) => (
                    <div key={index} className="p-2 rounded bg-slate-50">
                        <p><strong className="font-semibold text-slate-700">You:</strong> <span className="text-slate-600">{turn.user}</span></p>
                        <p><strong className="font-semibold text-blue-700">Tutor:</strong> <span className="text-slate-600">{turn.model}</span></p>
                    </div>
                 ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const AiTools: React.FC = () => {
    const [mode, setMode] = useState<AiToolMode>(AiToolMode.Tutor);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">AI Tools</h2>
            <div className="flex space-x-1 sm:space-x-2 border-b-2 border-slate-200 mb-6">
                {Object.values(AiToolMode).map(toolMode => (
                    <button
                        key={toolMode}
                        onClick={() => setMode(toolMode)}
                        className={`px-2 sm:px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none ${
                            mode === toolMode
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
                        }`}
                    >
                        {toolMode}
                    </button>
                ))}
            </div>

            <div>
                {mode === AiToolMode.Tutor && <AiTutor />}
                {mode === AiToolMode.Regulatory && <RegulatoryQnA />}
                {mode === AiToolMode.Chatbot && <GeneralChatbot />}
            </div>
        </div>
    );
};

export default AiTools;