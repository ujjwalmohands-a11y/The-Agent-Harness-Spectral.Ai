import React, { useState, useRef, useEffect } from 'react';
import { Check, Volume2, Square } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => generateId());
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const endOfMessagesRef = useRef(null);
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  const hasInitialized = useRef(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakMessage = (id, text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const cancelSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApproval = async (id, approved) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, status: approved ? 'approved' : 'rejected' } : msg
      )
    );

    // Add confirmation trace
    const statusText = approved ? 'Approved by you' : 'Rejected by you';
    setMessages(prev => [
      ...prev,
      { id: generateId(), type: 'trace', status: 'success', content: `${statusText} · action recorded`, role: 'system' }
    ]);

    await sendRequest({ approvalId: id, approved });
  };


  const sendRequest = async (payload) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processLine = (rawLine) => {
        const line = rawLine.replace(/\r$/, '');
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') return;
          if (!dataStr) return;

          try {
            const data = JSON.parse(dataStr);
            setMessages((prev) => {
              const existingIndex = prev.findIndex((m) => m.id === data.id);
              if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...data };
                return updated;
              }
              return [...prev, data];
            });
          } catch (err) {
            console.error('Failed to parse SSE event chunk:', dataStr, err);
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          processLine(rawLine);
        }
      }

      if (buffer.trim()) {
        processLine(buffer);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      // Let's add an error trace instead of a big bubble
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          type: 'trace',
          status: 'error',
          content: 'backend disconnected · check console',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitMessage = async (textPayload) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), type: 'text', role: 'user', content: textPayload },
    ]);
    await sendRequest({ text: textPayload });
  };

  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true;
      submitMessage(initialPrompt);
      // Clean up state so refresh doesn't resubmit
      window.history.replaceState({}, document.title);
    }
  }, [initialPrompt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const textPayload = input.trim();
    setInput('');
    await submitMessage(textPayload);
  };

  return (
    <div className="min-h-screen bg-white text-gray-700 font-mono p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl border border-gray-200 rounded-sm overflow-hidden flex flex-col bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-black rounded-sm"></div>
            <span className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">A TrueForge Session</span>
          </div>
          <div className="border border-gray-200 px-3 py-1 text-[10px] text-gray-500 uppercase tracking-widest bg-gray-50">
            Session ID {sessionId}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-6 space-y-5 min-h-[60vh] max-h-[75vh] overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-gray-600 text-sm flex gap-3">
              <span className="text-gray-400">&gt;</span>
              <span>Waiting for instructions...</span>
            </div>
          )}
          {messages.map((msg) => (
            <MessageRow 
              key={msg.id} 
              msg={msg} 
              onApprove={handleApproval} 
              onSpeak={speakMessage}
              onStopSpeak={cancelSpeech}
              isSpeaking={speakingMessageId === msg.id}
            />
          ))}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <span className="text-black font-bold mt-0.5">&gt;</span>
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-black placeholder-gray-400"
              placeholder="Instruct the agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ msg, onApprove, onSpeak, onStopSpeak, isSpeaking }) {
  if (msg.type === 'text') {
    const isUser = msg.role === 'user';
    return (
      <div className="flex gap-3 group">
        {isUser ? (
          <span className="text-black font-bold">&gt;</span>
        ) : (
          <span className="text-gray-500 font-bold">&lt;</span>
        )}
        <div className="flex-1 flex gap-2">
          <span className="text-gray-800 font-medium">{msg.content}</span>
          {!isUser && (
            <button
              onClick={() => isSpeaking ? onStopSpeak() : onSpeak(msg.id, msg.content)}
              className="text-gray-400 hover:text-black transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center ml-2"
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={16} />}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === 'trace') {
    return (
      <div className="flex gap-3 items-center ml-5 text-sm">
        {msg.status === 'success' ? (
          <Check size={14} className="text-gray-500" strokeWidth={3} />
        ) : msg.status === 'error' ? (
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1"></div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1"></div>
        )}
        <span className={`${msg.status === 'success' ? 'text-gray-600' : 'text-gray-400'}`}>
          {msg.content || 'running task...'}
        </span>
      </div>
    );
  }

  if (msg.type === 'approval') {
    const isPending = msg.status === 'pending' || !msg.status;
    return (
      <div className="my-6 border-l-2 border-black bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between ml-5 shadow-sm rounded-r-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-black"></div>
          <span className="text-black font-medium">{msg.content}</span>
        </div>

        {isPending ? (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(msg.id, true)}
              className="border border-gray-300 text-black hover:bg-gray-200 px-4 py-1 text-xs uppercase tracking-widest transition-colors font-semibold rounded-sm bg-gray-100"
            >
              Approve
            </button>
            <button
              onClick={() => onApprove(msg.id, false)}
              className="border border-gray-300 text-red-600 hover:bg-red-50 px-4 py-1 text-xs uppercase tracking-widest transition-colors font-semibold rounded-sm bg-white"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-widest border border-gray-200 px-3 py-1 bg-gray-50 text-gray-500">
              {msg.status}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
