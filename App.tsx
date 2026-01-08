
import React, { useState, useRef, useEffect } from 'react';
import { TranscriptionService } from './services/geminiService';
import { TranscriptionMode, ProcessingStatus } from './types';
import { fileToBase64, formatTime } from './utils/audioUtils';
import { ResultDisplay } from './components/ResultDisplay';
import { AudioVisualizer } from './components/AudioVisualizer';

declare const window: any;

interface User {
  name: string;
  email: string;
  picture: string;
}

interface PendingAudio {
  blob: Blob | File;
  url: string;
  mimeType: string;
}

type ViewState = 'landing' | 'login' | 'active' | 'preview' | 'result';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle' });
  const [mode, setMode] = useState<TranscriptionMode>(TranscriptionMode.CLEAN_READ);
  const [result, setResult] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleLogin = () => {
    setUser({
      name: 'Saaadmalikk1998',
      email: 'saad@ninja.ai',
      picture: 'SA'
    });
    setView('active');
  };

  const handleSignOut = () => {
    setUser(null);
    setView('landing');
    setResult(null);
    setPendingAudio(null);
    setStatus({ step: 'idle' });
  };

  const handleDiscard = () => {
    if (pendingAudio?.url) {
      URL.revokeObjectURL(pendingAudio.url);
    }
    setPendingAudio(null);
    setView('active');
    setStatus({ step: 'idle' });
  };

  const startRecording = async () => {
    try {
      setPendingAudio(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setPendingAudio({ blob: audioBlob, url, mimeType: 'audio/webm' });
        setStatus({ step: 'idle' });
        stream.getTracks().forEach(track => track.stop());
        setActiveStream(null);
        setView('preview');
      };
      recorder.start();
      setStatus({ step: 'recording' });
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => setRecordingSeconds(prev => prev + 1), 1000);
    } catch (err) {
      setStatus({ step: 'error', message: 'Microphone access denied.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingAudio({ blob: file, url, mimeType: file.type });
    setResult(null);
    setStatus({ step: 'idle' });
    setView('preview');
  };

  const initiateAnalysis = async () => {
    if (!pendingAudio) return;
    try {
      setStatus({ step: 'analyzing', message: 'Analyzing auditory feed...' });
      setView('result');
      const base64 = await fileToBase64(pendingAudio.blob);
      const service = new TranscriptionService();
      const output = await service.analyzeAudio(base64, pendingAudio.mimeType, mode);
      setResult(output);
      setPendingAudio(null);
      setStatus({ step: 'completed' });
    } catch (err: any) {
      console.error(err);
      setStatus({ step: 'error', message: err.message || 'Linguistic analysis failed. Please verify API configuration.' });
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const AppHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 glass no-print">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-wave-square"></i>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Note Ninja</h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mt-1">ANALYSIS ACTIVE • BY MUHAMMAD AHSAN</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {Object.values(TranscriptionMode).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {m}
            </button>
          ))}
        </div>
        
        {user && (
          <div className="flex items-center gap-3 md:gap-4 pl-4 md:pl-8 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
              <button onClick={handleSignOut} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors mt-1">
                 <i className="fas fa-power-off text-[8px] mr-1"></i> SIGN OUT
              </button>
            </div>
            <div className="relative">
              <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl">
                {user.picture}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </header>
  );

  const FloatingFooter = () => (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 py-6 pointer-events-none no-print bg-gradient-to-t from-slate-50/80 via-slate-50/20 to-transparent">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center text-white text-sm shadow-lg">
           <i className="fas fa-wave-square"></i>
        </div>
        <span className="text-slate-900 font-black tracking-tight text-lg">Note Ninja</span>
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          DEVELOPED WITH EXCELLENCE BY MUHAMMAD AHSAN
        </div>
        <div className="text-[8px] font-bold text-slate-300 tracking-normal mt-1">
          © 2024 Note Ninja Linguistic Intelligence System
        </div>
      </div>
    </div>
  );

  // VIEW: LANDING
  if (view === 'landing') {
    return (
      <div className="min-h-screen pt-24 pb-40 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-8 max-w-5xl animate-in fade-in duration-1000">
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight">
            Elite Multimodal <span className="gradient-text">Transcription</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
            Execute deep linguistic analysis with 100% fidelity. Our engine is optimized for technical jargon and complex multi-speaker environments.
          </p>
          <p className="text-xs font-black uppercase tracking-[0.5em] text-indigo-500">
            ZERO-LOSS ENGINE V2.5 • CREATED BY MUHAMMAD AHSAN
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mt-16 animate-in slide-in-from-bottom-12 duration-700">
          <div onClick={() => setView('login')} className="glass p-10 md:p-14 rounded-[3.5rem] space-y-8 group hover:scale-[1.02] transition-all cursor-pointer shadow-xl hover:shadow-indigo-100 border-white/60">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:rotate-12">
              <i className="fas fa-microphone text-2xl"></i>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Live Intercept</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Capture audio in real-time with automatic speaker identification and signal cleaning.</p>
            </div>
          </div>
          <div onClick={() => setView('login')} className="glass p-10 md:p-14 rounded-[3.5rem] space-y-8 group hover:scale-[1.02] transition-all cursor-pointer shadow-xl hover:shadow-purple-100 border-white/60">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm transition-transform group-hover:rotate-12">
              <i className="fas fa-layer-group text-2xl"></i>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">File Processing</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Ingest WAV, MP3, or M4A assets for deep-learning linguistic analysis and translation.</p>
            </div>
          </div>
        </div>

        <button onClick={() => setView('login')} className="fixed bottom-12 right-12 w-20 h-20 gradient-bg text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-[60] group">
          <i className="fas fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
        </button>
        <FloatingFooter />
      </div>
    );
  }

  // VIEW: LOGIN
  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass p-12 md:p-16 rounded-[4rem] w-full max-w-xl text-center space-y-12 shadow-2xl animate-in zoom-in duration-500 border-white">
          <div className="w-24 h-24 gradient-bg rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-100">
            <i className="fas fa-wave-square text-4xl"></i>
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Note Ninja</h1>
            <p className="text-xl text-slate-500 font-semibold tracking-tight">Elite Multimodal Transcription Engine</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">DEVELOPED BY MUHAMMAD AHSAN</p>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mt-6 shadow-sm">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              ZERO-LOSS ENGINE READY
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <span className="relative px-6 bg-white/70 text-[10px] font-black uppercase text-slate-300 tracking-widest">or secure email</span>
            </div>
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
              <i className="fas fa-envelope text-indigo-500"></i>
              Continue with Email
            </button>
          </div>

          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed pt-6">
            NOTE NINJA TERMINAL V2.5 • DEVELOPED BY MUHAMMAD AHSAN
          </p>
        </div>
      </div>
    );
  }

  // VIEW: ACTIVE TERMINAL
  if (view === 'active') {
    return (
      <div className="min-h-screen pt-32 pb-40 p-8 space-y-16">
        <AppHeader />
        <div className="text-center space-y-6 max-w-4xl mx-auto animate-in fade-in duration-700">
           <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight">
             Elite Multimodal <span className="gradient-text">Transcription</span>
           </h1>
           <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
             Execute deep linguistic analysis with 100% fidelity. Our engine is optimized for technical jargon and complex multi-speaker environments.
           </p>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
             ZERO-LOSS ENGINE V2.5 • CREATED BY MUHAMMAD AHSAN
           </p>
        </div>

        {status.step === 'recording' ? (
          <div className="max-w-4xl mx-auto glass p-20 rounded-[4rem] text-center space-y-10 shadow-2xl border-indigo-50 animate-in zoom-in duration-500">
             <div className="inline-flex items-center gap-3 bg-red-50 px-6 py-2 rounded-full border border-red-100 text-red-600">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_12px_red]"></span>
                <span className="text-xs font-black uppercase tracking-[0.2em]">SIGNAL CAPTURING</span>
             </div>
             <div className="text-8xl md:text-[10rem] font-black tabular-nums tracking-tighter text-slate-900 leading-none">{formatTime(recordingSeconds)}</div>
             <AudioVisualizer stream={activeStream} />
             <button onClick={stopRecording} className="px-16 py-6 bg-red-600 text-white rounded-3xl font-black text-xl hover:bg-red-700 transition-all shadow-2xl active:scale-95">
               CEASE INTERCEPT
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto pt-10">
            <div onClick={startRecording} className="glass p-16 rounded-[4rem] text-center space-y-8 cursor-pointer group hover:bg-white hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl border-white/60">
              <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto group-hover:scale-110 transition-transform shadow-sm">
                 <i className="fas fa-microphone text-4xl"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Live Intercept</h3>
                <p className="text-slate-500 font-medium text-lg">Initialize real-time auditory feed capture.</p>
              </div>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className="glass p-16 rounded-[4rem] text-center space-y-8 cursor-pointer group hover:bg-white hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl border-white/60">
              <div className="w-24 h-24 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 mx-auto group-hover:scale-110 transition-transform shadow-sm">
                 <i className="fas fa-layer-group text-4xl"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">File Processing</h3>
                <p className="text-slate-500 font-medium text-lg">Ingest existing data assets for analysis.</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
              </div>
            </div>
          </div>
        )}
        <FloatingFooter />
      </div>
    );
  }

  // VIEW: QUALITY CHECK PREVIEW
  if (view === 'preview') {
    return (
      <div className="min-h-screen pt-32 pb-40 px-6 animate-in fade-in duration-500">
        <AppHeader />
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">Intercept Quality Check</h2>
            <p className="text-xl text-slate-500 font-medium">Verify the auditory feed before final linguistic ingestion.</p>
          </div>

          <div className="glass p-12 md:p-24 rounded-[4.5rem] space-y-16 shadow-2xl relative overflow-hidden border-white">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-100/40 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-100/40 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10 space-y-16">
              <div className="flex justify-center">
                <button onClick={togglePlayback} className="w-40 h-40 gradient-bg text-white rounded-[3.5rem] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group">
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play ml-4'} text-6xl group-hover:scale-110 transition-transform`}></i>
                </button>
              </div>

              <div className="space-y-8 px-4 md:px-12">
                <div className="flex items-center gap-4 bg-white/50 px-6 py-2.5 rounded-2xl border border-white/80 w-fit mx-auto shadow-sm">
                  <span className="text-xs font-black text-indigo-500 tabular-nums tracking-widest">{formatTime(Math.floor(currentTime))}</span>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <span className="text-xs font-black text-slate-400 tabular-nums tracking-widest">{formatTime(Math.floor(duration))}</span>
                </div>
                <div className="relative pt-2">
                  <input type="range" min="0" max={duration} value={currentTime} onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = time;
                  }} className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 transition-all hover:h-3" />
                </div>
                <audio ref={audioRef} src={pendingAudio?.url} onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={() => setIsPlaying(false)} className="hidden" />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button onClick={initiateAnalysis} className="flex-1 py-7 gradient-bg text-white rounded-3xl font-black text-2xl hover:shadow-2xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-5 active:scale-[0.98]">
                  <i className="fas fa-brain"></i> EXECUTE ANALYSIS
                </button>
                <button onClick={handleDiscard} className="w-full sm:w-56 py-7 bg-white border border-slate-100 rounded-3xl font-black text-2xl text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm">
                  DISCARD
                </button>
              </div>
            </div>
          </div>
        </div>
        <FloatingFooter />
      </div>
    );
  }

  // VIEW: RESULTS
  return (
    <div className="min-h-screen pt-32 pb-40 px-6">
      <AppHeader />
      <div className="max-w-5xl mx-auto">
        {status.step === 'analyzing' ? (
          <div className="py-40 text-center space-y-10 animate-in fade-in duration-1000">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-indigo-200 blur-3xl animate-pulse scale-150"></div>
              <i className="fas fa-circle-notch fa-spin text-8xl text-indigo-600 relative z-10"></i>
            </div>
            <div className="space-y-6">
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Engine Active</h2>
              <p className="text-2xl text-slate-500 font-medium">Executing deep linguistic extraction protocols...</p>
            </div>
          </div>
        ) : status.step === 'error' ? (
          <div className="py-32 text-center space-y-10 glass rounded-[4rem] border-red-100 max-w-2xl mx-auto shadow-2xl animate-in zoom-in border-white">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto text-5xl shadow-sm">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="space-y-4 px-12">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Analysis Interrupted</h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">{status.message}</p>
            </div>
            <div className="flex gap-6 justify-center px-12 pt-4">
              <button onClick={() => setView('active')} className="px-12 py-5 gradient-bg text-white rounded-3xl font-black text-lg shadow-xl hover:shadow-indigo-200 transition-all">Retry Sequence</button>
              <button onClick={() => setView('landing')} className="px-12 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-lg">Go Back</button>
            </div>
          </div>
        ) : (
          <div id="transcription-report" className="animate-in slide-in-from-bottom-8 duration-700 pb-20">
             {result && <ResultDisplay markdown={result} />}
             <div className="flex justify-center mt-16 no-print">
                <button onClick={() => { setView('active'); setResult(null); }} className="px-14 py-6 gradient-bg text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  INITIALIZE NEW SESSION
                </button>
             </div>
          </div>
        )}
      </div>
      <FloatingFooter />
    </div>
  );
};

export default App;
