
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/Button';
import { Disclaimer } from './components/Disclaimer';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { UploadedFile, FileType, ChatMessage } from './types';
import { analyzeMedicalData, createChatSession, sendChatMessage } from './services/geminiService';
import { Chat } from "@google/genai";

// --- Types for strict UI Logic ---
type ViewState = 'home' | 'manual' | 'upload' | 'results' | 'camera';

interface AnalysisJSON {
  summary: string;
  sections: Array<{ title: string; content: string }>;
  questions: string[];
}

// --- Icons (Lucide-style Thin SVGs) ---
const Icons = {
  Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Camera: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  FileText: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ArrowLeft: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Circle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>,
  ZoomIn: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  AlertCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  MessageCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Mic: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  MicOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ThumbsUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
  ThumbsDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2"></path></svg>,
};

const HELP_TEXT = `**Welcome to MediClear!** 🏥

**What is this?**
I'm an AI assistant that simplifies medical reports into plain English.

**How to use:**
1. **Upload** or **Scan** your medical report.
2. **Read** the simplified breakdown.
3. **Chat** with me to clarify specific terms.

**Disclaimer:**
I provide information, not medical advice. Always consult your doctor.`;

function App() {
  // Navigation & Data State
  const [view, setView] = useState<ViewState>('home');
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [manualText, setManualText] = useState('');
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Chat State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Home Floating Chat State (Lifted to fix bug)
  const [isHomeChatOpen, setIsHomeChatOpen] = useState(false);
  
  // Voice Dictation State
  const [isListening, setIsListening] = useState(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number, max: number, step: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [cameraLoading, setCameraLoading] = useState(false);

  // UI Helper State
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, view, isHomeChatOpen]);

  // Initialize generic chat for non-result views
  useEffect(() => {
    if (view !== 'results' && (!chatSession || chatHistory.length === 0)) {
        const chat = createChatSession("You are a knowledgeable medical assistant. The user is browsing the app and has not uploaded any medical results yet. Answer general medical questions accurately but do not provide diagnosis.");
        setChatSession(chat);
        setChatHistory([{
          id: 'init-home',
          role: 'model',
          text: HELP_TEXT,
          timestamp: Date.now()
        }]);
    }
  }, [view]);

  // Clean up stream on view change
  useEffect(() => {
    if (view !== 'camera' && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [view]);

  // Voice Dictation Logic
  const toggleRecording = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice dictation is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };


  // Handle Zoom change
  const handleZoomChange = async (val: number) => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ zoom: val } as any] });
        setCurrentZoom(val);
      } catch (err) {
        console.warn("Zoom constraint failed", err);
      }
    }
  };

  // --- Actions ---

  const showHelp = () => {
    setIsHomeChatOpen(true);
    setChatHistory(prev => {
      // Don't add duplicate if it's already the last message
      if (prev.length > 0 && prev[prev.length - 1].text === HELP_TEXT) {
        return prev;
      }
      return [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: HELP_TEXT,
        timestamp: Date.now()
      }];
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (f: File) => {
    setUploadProgress(1);
    setFile(null);

    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFile({
        data: result,
        type: f.type.startsWith('image/') ? FileType.IMAGE : FileType.TEXT,
        mimeType: f.type,
        name: f.name
      });
      setUploadProgress(0);
    };
    reader.readAsDataURL(f);
  };

  const startCamera = async () => {
    setView('camera');
    setCapturedImage(null);
    setError(null);
    setCameraLoading(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      
      const track = s.getVideoTracks()[0];
      const capabilities = (track as any).getCapabilities?.();
      if (capabilities && capabilities.zoom) {
        setZoomCapabilities({
          min: capabilities.zoom.min,
          max: capabilities.zoom.max,
          step: capabilities.zoom.step || 0.1
        });
        setCurrentZoom(capabilities.zoom.min || 1);
      }
    } catch (err: any) {
      console.error("Camera Access Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("CAMERA_PERMISSION_DENIED");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("CAMERA_NOT_FOUND");
      } else {
        setError("CAMERA_GENERAL_ERROR");
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(dataUrl);
        setFile({
          data: dataUrl,
          type: FileType.IMAGE,
          mimeType: 'image/jpeg',
          name: 'captured_report.jpg'
        });
      }
    }
  };

  const handleAnalyze = async () => {
    const payload = file || (manualText ? { data: manualText, type: FileType.TEXT } : null);
    if (!payload) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const rawResult = await analyzeMedicalData(payload, manualText !== payload.data ? manualText : '');
      
      // Parse JSON
      let parsed: AnalysisJSON;
      try {
        parsed = JSON.parse(rawResult);
      } catch {
        parsed = {
          summary: "Could not structure the data perfectly. Here is the raw output.",
          sections: [{ title: "Raw Analysis", content: rawResult }],
          questions: ["What do my results mean?"]
        };
      }

      setAnalysisData(parsed);
      setFeedback(null);
      const newChat = createChatSession(JSON.stringify(parsed));
      setChatSession(newChat);
      setChatHistory([{
        id: 'welcome',
        role: 'model',
        text: "I've analyzed your document. You can ask me questions about specific values or medical terms found in your results.",
        timestamp: Date.now()
      }]);
      setChatInput(''); // Clear input for result view

      setView('results');
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || !chatSession) return;
    
    const userText = chatInput;
    setChatInput('');

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setIsChatSending(true);

    try {
      const response = await sendChatMessage(chatSession, userText);
      const botMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', text: response, timestamp: Date.now() };
      setChatHistory(prev => [...prev, botMsg]);
    } catch {
      // Error handling
    } finally {
      setIsChatSending(false);
    }
  };

  // --- Header Component ---
  const Header = ({ title, subtitle, backAction }: { title: string, subtitle?: string, backAction?: () => void }) => (
    <div className="mb-8">
      {backAction && (
        <button onClick={backAction} className="text-[#A5B5AF] hover:text-[#E5ECEA] mb-6 flex items-center gap-2 transition-colors">
          <Icons.ArrowLeft />
          <span className="font-editorial text-sm tracking-wide">BACK</span>
        </button>
      )}
      <h1 className="text-3xl md:text-4xl font-editorial font-bold text-[#E5ECEA] tracking-tight">{title}</h1>
      {subtitle && <p className="font-clinical text-[#A5B5AF] mt-2 text-sm">{subtitle}</p>}
    </div>
  );

  // --- Render Functions (To prevent unmounting issues) ---

  const renderHomeView = () => (
    <div className="max-w-xl mx-auto pt-12 animate-fade-in relative">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-editorial font-bold text-[#E5ECEA] mb-4 tracking-tight">MediClear</h1>
            <p className="font-clinical text-[#A5B5AF]">Advanced Medical Result Interpretation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setView('upload')}
            className="group cursor-pointer bg-[#0D1F1A] border border-[#123C33] hover:border-[#0E9B62] p-6 rounded-[8px] flex flex-col gap-4 transition-all"
          >
            <div className="w-10 h-10 bg-[#0A1512] rounded-full flex items-center justify-center text-[#E5ECEA] group-hover:text-[#0E9B62] border border-[#123C33] transition-colors">
              <Icons.Upload />
            </div>
            <div>
              <h3 className="font-editorial font-semibold text-[#E5ECEA] text-lg">Upload Report</h3>
              <p className="font-clinical text-[#A5B5AF] text-sm mt-1">PDF or image files</p>
            </div>
          </div>

          <div 
             onClick={startCamera}
             className="group cursor-pointer bg-[#0D1F1A] border border-[#123C33] hover:border-[#0E9B62] p-6 rounded-[8px] flex flex-col gap-4 transition-all"
          >
            <div className="w-10 h-10 bg-[#0A1512] rounded-full flex items-center justify-center text-[#E5ECEA] group-hover:text-[#0E9B62] border border-[#123C33] transition-colors">
              <Icons.Camera />
            </div>
            <div>
              <h3 className="font-editorial font-semibold text-[#E5ECEA] text-lg">Take a Picture</h3>
              <p className="font-clinical text-[#A5B5AF] text-sm mt-1">Scan using camera</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setView('manual')}
            className="font-clinical text-[#A5B5AF] hover:text-[#0E9B62] text-sm underline underline-offset-4"
          >
            Enter results manually
          </button>
        </div>

        <div className="mt-16">
           <h4 className="font-editorial text-[#A5B5AF] text-sm uppercase tracking-wider mb-6 border-b border-[#123C33] pb-2">Recent Interpretations</h4>
           <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-[#123C33]/50 hover:bg-[#123C33]/10 px-2 transition-colors cursor-pointer">
                <span className="font-clinical text-[#E5ECEA] text-sm">Full Blood Count Analysis</span>
                <span className="font-clinical text-[#A5B5AF] text-xs">OCT 24, 2024</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#123C33]/50 hover:bg-[#123C33]/10 px-2 transition-colors cursor-pointer">
                <span className="font-clinical text-[#E5ECEA] text-sm">Metabolic Panel Report</span>
                <span className="font-clinical text-[#A5B5AF] text-xs">OCT 12, 2024</span>
              </div>
           </div>
        </div>
      </div>
  );

  const renderCameraView = () => {
      const renderError = () => {
        let title = "Camera Error";
        let description = "An unexpected error occurred while starting the camera.";
        let actionText = "TRY AGAIN";
  
        if (error === "CAMERA_PERMISSION_DENIED") {
          title = "Access Denied";
          description = "Camera access was denied. Please update your browser settings to allow camera access for analysis.";
        } else if (error === "CAMERA_NOT_FOUND") {
          title = "No Camera Found";
          description = "We couldn't detect a camera on this device. Please try uploading a file instead.";
        }
  
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0D1F1A]">
            <div className="text-[#E05252] mb-4">
              <Icons.AlertCircle />
            </div>
            <h3 className="font-editorial font-bold text-[#E5ECEA] text-xl mb-2">{title}</h3>
            <p className="font-clinical text-[#A5B5AF] text-sm mb-8 max-w-xs">{description}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {error !== "CAMERA_NOT_FOUND" && (
                <Button onClick={startCamera}>{actionText}</Button>
              )}
              <Button variant="secondary" onClick={() => { setView('upload'); setError(null); }}>UPLOAD FILE INSTEAD</Button>
              <button 
                onClick={() => { setView('home'); setError(null); }} 
                className="mt-2 font-clinical text-[#A5B5AF] text-xs hover:text-[#E5ECEA] uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      };
  
      return (
        <div className="max-w-2xl mx-auto pt-8 animate-fade-in pb-12">
          <Header title="Scan Report" subtitle="Align document within the frame for capture." backAction={() => { setView('home'); setError(null); }} />
          
          <div className="relative bg-black rounded-[8px] overflow-hidden aspect-[3/4] border border-[#123C33]">
            {cameraLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1F1A]">
                 <div className="w-8 h-8 border-2 border-[#123C33] border-t-[#0E9B62] rounded-full animate-spin mb-4"></div>
                 <p className="font-clinical text-[#A5B5AF] text-xs uppercase tracking-widest">Initializing Hardware...</p>
              </div>
            ) : error ? (
              renderError()
            ) : !capturedImage ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {/* Visual Guides Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Darkened overlay with hole using massive box-shadow */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80%] rounded-[12px] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] border border-white/20">
                     {/* Corner Indicators */}
                     <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-[#0E9B62] rounded-tl-[4px]"></div>
                     <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-[#0E9B62] rounded-tr-[4px]"></div>
                     <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-[#0E9B62] rounded-bl-[4px]"></div>
                     <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-[#0E9B62] rounded-br-[4px]"></div>
                     
                     {/* Scanning Line Animation */}
                     <div className="absolute left-2 right-2 h-0.5 bg-[#0E9B62] shadow-[0_0_10px_#0E9B62] animate-scan opacity-80"></div>
  
                     {/* Helper Text */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 text-white">
                        <Icons.Camera /> 
                     </div>
                  </div>
                  
                  <div className="absolute bottom-32 left-0 right-0 text-center z-20">
                     <p className="inline-block bg-black/60 text-white/90 px-4 py-1.5 rounded-full text-xs font-clinical tracking-wider border border-white/10 backdrop-blur-md">
                       ALIGN DOCUMENT WITHIN FRAME
                     </p>
                  </div>
                </div>
                
                {/* Zoom Control */}
                {zoomCapabilities && (
                  <div className="absolute bottom-28 left-0 right-0 px-12 flex items-center gap-4 bg-black/30 py-2 backdrop-blur-sm z-30">
                    <button onClick={() => handleZoomChange(Math.max(zoomCapabilities.min, currentZoom - 0.5))} className="text-[#E5ECEA]">
                      <Icons.ZoomOut />
                    </button>
                    <input 
                      type="range" 
                      min={zoomCapabilities.min} 
                      max={zoomCapabilities.max} 
                      step={zoomCapabilities.step} 
                      value={currentZoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="flex-1 accent-[#0E9B62] h-1"
                    />
                    <button onClick={() => handleZoomChange(Math.min(zoomCapabilities.max, currentZoom + 0.5))} className="text-[#E5ECEA]">
                      <Icons.ZoomIn />
                    </button>
                  </div>
                )}
                
                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center z-30">
                   <button 
                     onClick={capturePhoto}
                     className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center group active:scale-95 transition-all bg-black/40"
                   >
                     <div className="w-12 h-12 bg-white rounded-full group-hover:bg-[#0E9B62] transition-colors"></div>
                   </button>
                </div>
              </>
            ) : (
              <>
                <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4">
                  <Button variant="secondary" onClick={() => setCapturedImage(null)}>RETAKE</Button>
                  <Button onClick={handleAnalyze} isLoading={isAnalyzing}>USE PHOTO</Button>
                </div>
              </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .animate-scan {
              animation: scan 4s linear infinite;
            }
          `}</style>
        </div>
      );
  };

  const renderUploadView = () => (
      <div className="max-w-2xl mx-auto pt-8 animate-fade-in">
        <Header title="Upload Document" subtitle="Supported formats: JPG, PNG. Max 5MB." backAction={() => setView('home')} />
        
        <div className="bg-[#0D1F1A] border border-dashed border-[#123C33] rounded-[8px] p-12 text-center transition-colors hover:border-[#0E9B62] hover:bg-[#0D1F1A]/80 relative group">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-16 h-16 bg-[#123C33]/30 rounded-full flex items-center justify-center text-[#E5ECEA] mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <Icons.Upload />
          </div>
          <h3 className="font-editorial font-medium text-[#E5ECEA] text-lg mb-2">Drag & Drop or Click to Upload</h3>
          <p className="font-clinical text-[#A5B5AF] text-sm">Clinical reports, lab results, doctor's notes</p>
        </div>
  
        {uploadProgress > 0 && !file && (
          <div className="mt-6 animate-fade-in">
              <div className="flex justify-between items-end mb-2">
                <span className="font-clinical text-[#E5ECEA] text-xs uppercase tracking-wider">Uploading...</span>
                <span className="font-clinical text-[#0E9B62] text-xs font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#123C33] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#0E9B62] h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(14,155,98,0.5)]" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
          </div>
        )}

        {file && (
          <div className="mt-6 bg-[#0D1F1A] border border-[#123C33] rounded-[6px] p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#123C33] rounded-[4px] flex items-center justify-center text-[#E5ECEA]">
                 <Icons.FileText />
               </div>
               <div>
                 <p className="font-clinical text-[#E5ECEA] text-sm truncate max-w-[200px]">{file.name || "scanned_document.jpg"}</p>
                 <p className="font-clinical text-[#A5B5AF] text-xs">Ready to analyze</p>
               </div>
             </div>
             <button onClick={() => setFile(null)} className="text-[#E05252] hover:bg-[#E05252]/10 p-2 rounded transition-colors">
               <Icons.Trash />
             </button>
          </div>
        )}
  
        <div className="mt-8">
          <Button onClick={handleAnalyze} disabled={!file} isLoading={isAnalyzing} className="w-full text-lg">
            ANALYZE DOCUMENT
          </Button>
        </div>
        {error && <p className="mt-4 text-[#E05252] font-clinical text-sm text-center">{error}</p>}
      </div>
  );

  const renderManualView = () => {
    const examples = [
      "WBC: 7.2",
      "RBC: 4.50",
      "Hemoglobin: 13.5",
      "Platelets: 250",
      "Glucose: 92 mg/dL",
      "Cholesterol: 185",
      "TSH: 2.1 mIU/L",
      "BP: 120/80"
    ];

    return (
      <div className="max-w-2xl mx-auto pt-8 animate-fade-in">
        <Header title="Enter Results" subtitle="Type out the values or paste from your digital record." backAction={() => setView('home')} />
        
        <div className="relative">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Example:&#10;WBC: 6.5&#10;RBC: 4.8&#10;Hemoglobin: 14.2..."
            className="w-full h-64 bg-[#0D1F1A] border border-[#123C33] text-[#E5ECEA] font-clinical text-sm p-6 rounded-[8px] focus:outline-none focus:border-[#0E9B62] resize-none placeholder-[#123C33]"
          />
        </div>
        
        {/* Manual Entry Examples */}
        <div className="mt-4">
          <p className="font-clinical text-[#A5B5AF] text-xs mb-3 uppercase tracking-wide">Common Examples:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, i) => (
               <button 
                 key={i}
                 onClick={() => setManualText(prev => prev ? prev + '\n' + ex : ex)}
                 className="bg-[#123C33]/30 hover:bg-[#123C33] border border-[#123C33] text-[#A5B5AF] hover:text-[#E5ECEA] px-3 py-1.5 rounded-[4px] text-xs font-clinical transition-colors"
               >
                 {ex}
               </button>
            ))}
          </div>
        </div>
  
        <div className="mt-8">
          <Button onClick={handleAnalyze} disabled={!manualText} isLoading={isAnalyzing} className="w-full text-lg">
            INTERPRET RESULTS
          </Button>
        </div>
        {error && <p className="mt-4 text-[#E05252] font-clinical text-sm text-center">{error}</p>}
      </div>
    );
  };

  const renderResultsView = () => (
      <div className="max-w-3xl mx-auto pt-8 pb-20 animate-fade-in">
        <div className="flex justify-between items-start mb-8 border-b border-[#123C33] pb-6">
          <div>
             <button onClick={() => { setView('home'); setFile(null); setManualText(''); setChatHistory([]); setChatSession(null); }} className="text-[#A5B5AF] hover:text-[#E5ECEA] mb-4 flex items-center gap-2 text-xs font-editorial tracking-widest uppercase no-print">
              <Icons.ArrowLeft /> Start New
            </button>
            <h1 className="text-2xl font-editorial font-bold text-[#E5ECEA]">Analysis Report</h1>
            <p className="font-clinical text-[#0E9B62] text-xs mt-1">GENERATED BY MEDICLEAR AI</p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="secondary" className="!py-2 !px-4 !text-xs">SHARE</Button>
            <Button 
                variant="secondary" 
                className="!py-2 !px-4 !text-xs flex items-center gap-2"
                onClick={() => window.print()}
            >
                <Icons.Download />
                SAVE PDF
            </Button>
          </div>
        </div>
  
        {analysisData && (
          <div className="space-y-8">
            <section className="bg-[#0D1F1A] border border-[#123C33] p-6 rounded-[8px]">
              <h3 className="font-editorial text-[#A5B5AF] text-sm uppercase tracking-wider mb-4">Summary</h3>
              <p className="font-clinical text-[#E5ECEA] leading-relaxed text-sm">{analysisData.summary}</p>
            </section>
  
            <div className="space-y-2">
              {analysisData.sections.map((section, idx) => (
                <div key={idx} className="border border-[#123C33] rounded-[8px] overflow-hidden bg-[#0A1512]">
                  <button 
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between p-4 bg-[#0D1F1A] hover:bg-[#123C33]/40 transition-colors text-left"
                  >
                    <span className="font-editorial font-semibold text-[#E5ECEA]">{section.title}</span>
                    <div className={`transition-transform duration-200 text-[#A5B5AF] ${expandedSections.includes(idx) ? 'rotate-180' : ''} no-print`}>
                      <Icons.ChevronDown />
                    </div>
                  </button>
                  {/* Always expand for print, or keep state */}
                  {(expandedSections.includes(idx)) && (
                    <div className="p-6 border-t border-[#123C33] bg-[#0A1512]">
                      <MarkdownRenderer content={section.content} />
                    </div>
                  )}
                </div>
              ))}
            </div>
  
            {/* Feedback Section */}
            <div className="mt-8 flex items-center justify-between bg-[#0D1F1A] border border-[#123C33] p-4 rounded-[8px] no-print">
              <p className="font-clinical text-[#A5B5AF] text-sm">Was this analysis helpful and accurate?</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFeedback('up')}
                  className={`p-2 rounded transition-colors ${feedback === 'up' ? 'bg-[#0E9B62]/20 text-[#0E9B62] border border-[#0E9B62]' : 'text-[#A5B5AF] hover:text-[#E5ECEA] hover:bg-[#123C33] border border-transparent'}`}
                >
                  <Icons.ThumbsUp />
                </button>
                <button 
                  onClick={() => setFeedback('down')}
                  className={`p-2 rounded transition-colors ${feedback === 'down' ? 'bg-[#E05252]/20 text-[#E05252] border border-[#E05252]' : 'text-[#A5B5AF] hover:text-[#E5ECEA] hover:bg-[#123C33] border border-transparent'}`}
                >
                  <Icons.ThumbsDown />
                </button>
              </div>
            </div>
            {feedback && (
              <p className="text-[#0E9B62] font-clinical text-xs text-right mt-2 no-print">Thank you for your feedback!</p>
            )}

            <Disclaimer />
  
            <div className="mt-12 pt-12 border-t border-[#123C33] no-print">
              <h3 className="font-editorial text-[#E5ECEA] font-bold text-xl mb-6">Ask Follow-up Questions</h3>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {analysisData.questions.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => setChatInput(q)}
                    className="bg-[#123C33]/50 hover:bg-[#0E9B62]/20 border border-[#123C33] hover:border-[#0E9B62] text-[#A5B5AF] hover:text-[#E5ECEA] px-3 py-2 rounded-[4px] text-xs font-clinical text-left transition-all"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
  
              <div className="space-y-6 mb-8">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[8px] border text-sm font-clinical leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#123C33] border-[#123C33] text-[#E5ECEA]' 
                        : 'bg-transparent border-[#123C33] text-[#A5B5AF]'
                    }`}>
                      {msg.role === 'model' ? <MarkdownRenderer content={msg.text} /> : msg.text}
                    </div>
                  </div>
                ))}
                {isChatSending && (
                   <div className="flex justify-start">
                     <div className="bg-transparent border border-[#123C33] px-4 py-3 rounded-[8px]">
                       <div className="flex gap-1">
                         <span className="w-1.5 h-1.5 bg-[#0E9B62] rounded-full animate-bounce"></span>
                         <span className="w-1.5 h-1.5 bg-[#0E9B62] rounded-full animate-bounce delay-100"></span>
                         <span className="w-1.5 h-1.5 bg-[#0E9B62] rounded-full animate-bounce delay-200"></span>
                       </div>
                     </div>
                   </div>
                )}
                <div ref={chatEndRef} />
              </div>
  
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message your digital assistant..."
                  className="w-full bg-[#0D1F1A] border border-[#123C33] text-[#E5ECEA] font-clinical text-sm py-4 pl-6 pr-24 rounded-[8px] focus:outline-none focus:border-[#0E9B62] focus:ring-1 focus:ring-[#0E9B62]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                        type="button"
                        onClick={toggleRecording}
                        className={`p-2 rounded transition-colors ${isListening ? 'text-[#E05252] animate-pulse' : 'text-[#A5B5AF] hover:text-[#E5ECEA]'}`}
                    >
                        <Icons.Mic />
                    </button>
                    <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatSending}
                    className="p-2 text-[#0E9B62] hover:bg-[#123C33] rounded transition-colors disabled:opacity-50"
                    >
                        <Icons.Send />
                    </button>
                </div>
              </form>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mt-8 no-print">
              <Button variant="secondary" className="flex-1">FIND A DOCTOR</Button>
              <Button variant="secondary" className="flex-1">SHARE WITH CLINIC</Button>
            </div>
          </div>
        )}
      </div>
  );

  return (
    <div className="min-h-screen bg-[#0A1512] px-4 md:px-6">
      <nav className="max-w-7xl mx-auto h-20 flex items-center justify-between border-b border-[#123C33] no-print">
         <div onClick={() => setView('home')} className="flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 bg-[#0E9B62] rounded-[4px]"></div>
            <span className="font-editorial font-bold text-[#E5ECEA] tracking-tight">MEDICLEAR</span>
         </div>
         <div className="hidden md:flex gap-6">
            <button 
              onClick={showHelp} 
              className="font-clinical text-xs text-[#A5B5AF] hover:text-[#0E9B62] uppercase tracking-wider"
            >
              Help
            </button>
         </div>
      </nav>

      <main>
        {view === 'home' && renderHomeView()}
        {view === 'upload' && renderUploadView()}
        {view === 'camera' && renderCameraView()}
        {view === 'manual' && renderManualView()}
        {view === 'results' && renderResultsView()}
      </main>

      {/* Floating Chat Widget - Global for non-result views */}
      {view !== 'results' && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end no-print">
           {isHomeChatOpen && (
              <div className="bg-[#0D1F1A] border border-[#123C33] rounded-lg w-80 md:w-96 h-[450px] shadow-2xl flex flex-col mb-4 overflow-hidden animate-fade-in-up">
                 <div className="bg-[#123C33] p-3 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#0E9B62] rounded-full animate-pulse"></div>
                        <span className="font-editorial text-[#E5ECEA] text-sm font-medium">MediClear Assistant</span>
                     </div>
                     <button onClick={() => setIsHomeChatOpen(false)} className="text-[#A5B5AF] hover:text-white transition-colors"><Icons.X /></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A1512]/50">
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-[8px] border text-sm font-clinical leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-[#123C33] border-[#123C33] text-[#E5ECEA]' 
                            : 'bg-[#0A1512] border-[#123C33] text-[#A5B5AF]'
                        }`}>
                            {msg.role === 'model' ? <MarkdownRenderer content={msg.text} /> : msg.text}
                        </div>
                        </div>
                    ))}
                    {isChatSending && (
                        <div className="flex justify-start">
                        <div className="bg-[#0A1512] border border-[#123C33] px-4 py-3 rounded-[8px]">
                            <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[#0E9B62] rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-[#0E9B62] rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-[#0E9B62] rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                 </div>
                 
                 <div className="p-3 border-t border-[#123C33] bg-[#0A1512] shrink-0">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full bg-[#0D1F1A] border border-[#123C33] text-[#E5ECEA] font-clinical text-sm py-3 pl-4 pr-20 rounded-[6px] focus:outline-none focus:border-[#0E9B62] focus:ring-1 focus:ring-[#0E9B62]"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button 
                                type="button"
                                onClick={toggleRecording}
                                className={`p-1.5 rounded transition-colors ${isListening ? 'text-[#E05252] animate-pulse' : 'text-[#A5B5AF] hover:text-[#E5ECEA]'}`}
                            >
                                <Icons.Mic />
                            </button>
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || isChatSending}
                                className="p-1.5 text-[#0E9B62] hover:bg-[#123C33] rounded transition-colors disabled:opacity-50"
                            >
                                <Icons.Send />
                            </button>
                        </div>
                    </form>
                 </div>
              </div>
           )}

           <button
             onClick={() => setIsHomeChatOpen(!isHomeChatOpen)}
             className="w-14 h-14 bg-[#0E9B62] hover:bg-[#0C8554] rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
           >
             {isHomeChatOpen ? <Icons.ChevronDown /> : <Icons.MessageCircle />}
           </button>
        </div>
      )}
    </div>
  );
}

export default App;
