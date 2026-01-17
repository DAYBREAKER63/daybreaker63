
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveMentorProps {
  onClose: () => void;
  systemDate: string;
  systemTime: string;
  aiModelName: string;
  autoStart?: boolean;
}

const LiveMentor: React.FC<LiveMentorProps> = ({ onClose, systemDate, systemTime, aiModelName, autoStart = false }) => {
  const [active, setActive] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'USER' | 'GURU'; text: string }[]>([]);
  const [status, setStatus] = useState<'CONNECTING' | 'READY' | 'ERROR' | 'IDLE'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-start logic
  useEffect(() => {
    if (autoStart) {
      startSession();
    }
  }, [autoStart]);

  // Manual Base64 Helpers
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    setStatus('CONNECTING');
    setErrorMessage(null);
    try {
      if (!process.env.API_KEY) {
        throw new Error("Missing System Key. Check environmental configuration.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('READY');
            setActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              })).catch(err => {
                console.error("Audio Processing Socket Error:", err);
              });
            };
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            try {
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputContextRef.current) {
                const ctx = outputContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              if (msg.serverContent?.inputAudioTranscription) {
                 setTranscription(prev => [...prev.slice(-4), { role: 'USER', text: msg.serverContent!.inputAudioTranscription!.text }]);
              }
              if (msg.serverContent?.outputTranscription) {
                 setTranscription(prev => [...prev.slice(-4), { role: 'GURU', text: msg.serverContent!.outputTranscription!.text }]);
              }
            } catch (innerError) {
              console.error("Guru Message Processing Error:", innerError);
            }
          },
          onerror: (e) => { 
            setStatus('ERROR'); 
            setErrorMessage("Communication Link Failed: Network Error.");
            console.error("Guru Socket Error:", e); 
          },
          onclose: () => { 
            setStatus('IDLE'); 
            setActive(false); 
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are a real, friendly, and motivating Gym Trainer and Performance Mentor named ${aiModelName} (or Guru Ji).
You talk like a real person—relatable, energetic, and supportive, but still focused on discipline and fitness.
The current System Date is ${systemDate}. The current System Time is ${systemTime}.

CORE PERSONALITY:
- Friendly Gym Trainer: Use words like "Brother", "Beta", "Champion", "Buddy".
- Multilingual: You are fluent in English, Hindi, and Hinglish. 
- You switch languages naturally based on how the user speaks to you. If they use Hindi/Hinglish, you reply in kind.
- Conversational: Don't just give orders; have a real conversation about fitness, life, or anything the user wants to discuss.
- Practical: Give real-world advice on diet, workouts, and mental toughness.

CORE RULES:
- Identify yourself as ${aiModelName} or Guru Ji.
- Keep the energy high and the tone encouraging.
- Be authoritative on fitness but friendly in interaction.
- If the user is struggling, motivate them like a big brother or a personal trainer would. "Body banani hai na? Toh mehnat karni padegi!"
- Keep spoken responses punchy and engaging.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e: any) {
      setStatus('ERROR');
      setErrorMessage(e?.message || "Protocol Failure: Verify Connection.");
      console.error("Guru Initiation Error:", e);
    }
  };

  const endSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    setActive(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md flex flex-col h-full">
        <header className="flex justify-between items-baseline mb-20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black tracking-[0.6em] text-zinc-800 uppercase">Guru Ji Session</span>
            <span className="text-[8px] font-mono text-zinc-900 uppercase tracking-widest">NAME: {aiModelName}</span>
          </div>
          <button onClick={endSession} className="text-[9px] font-black tracking-widest text-zinc-600 hover:text-white transition-colors">
            [ TERMINATE ]
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          {!active ? (
            <div className="text-center space-y-12">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] max-w-[200px] mx-auto leading-relaxed">
                {aiModelName} (Guru Ji) is ready to train.
              </p>
              
              {errorMessage && (
                <div className="p-4 border border-red-900/40 bg-red-950/10 mb-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-700">{errorMessage}</p>
                </div>
              )}

              <button 
                onClick={startSession}
                disabled={status === 'CONNECTING'}
                className="border border-white px-10 py-5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all disabled:opacity-20"
              >
                {status === 'CONNECTING' ? 'CONNECTING...' : 'START CONSULTATION'}
              </button>
            </div>
          ) : (
            <div className="w-full space-y-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-1 h-1 bg-white animate-ping rounded-full mb-4" />
                <span className="text-[10px] font-black tracking-[0.8em] text-white uppercase animate-pulse">Session Live</span>
              </div>

              <div className="w-full h-[1px] bg-zinc-900 overflow-hidden relative">
                <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_infinite]" />
              </div>

              <div className="space-y-6 max-h-[300px] overflow-hidden opacity-40">
                {transcription.map((t, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[8px] font-black tracking-widest text-zinc-700">{t.role === 'GURU' ? aiModelName : 'YOU'}</span>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 leading-tight">
                      {t.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-auto py-12 text-center">
          <span className="text-[8px] font-black uppercase tracking-[1em] text-zinc-900">Training Time: {systemTime}</span>
        </footer>
      </div>
    </div>
  );
};

export default LiveMentor;
