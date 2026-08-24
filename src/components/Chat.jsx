import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Database, 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  Send,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { MessagePair } from "@/components/elements/message-pair";
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "@/components/ui/chat-container";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input";

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
  const [expandedTraces, setExpandedTraces] = useState({});
  const messagesEndRef = useRef(null);
  
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleTrace = (id) => {
    setExpandedTraces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproval = async (id, approved) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, status: approved ? 'approved' : 'rejected' } : msg
      )
    );

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
      window.history.replaceState({}, document.title);
    }
  }, [initialPrompt]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const textPayload = input.trim();
    setInput('');
    await submitMessage(textPayload);
  };

  const getToolIcon = (content) => {
    const text = (content || '').toLowerCase();
    if (text.includes('database') || text.includes('sql')) return <Database className="w-4 h-4 text-zinc-400" />;
    if (text.includes('terminal') || text.includes('build') || text.includes('run')) return <Terminal className="w-4 h-4 text-zinc-400" />;
    return <Play className="w-4 h-4 text-zinc-400" />;
  };

  // Group messages into pairs (User Msg -> Agent Msgs)
  const groupedMessages = [];
  let currentGroup = null;

  messages.forEach(msg => {
    if (msg.role === 'user') {
      if (currentGroup) groupedMessages.push(currentGroup);
      currentGroup = { userMsg: msg, agentResponses: [] };
    } else {
      if (!currentGroup) currentGroup = { userMsg: null, agentResponses: [] };
      currentGroup.agentResponses.push(msg);
    }
  });
  if (currentGroup) groupedMessages.push(currentGroup);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white/20">
      
      {/* Sleek Minimal Sidebar */}
      <aside className="w-64 border-r border-white/5 flex-col hidden md:flex bg-[#09090b]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 shadow-sm">
            <Sparkles className="w-4 h-4 text-zinc-200" />
          </div>
          <h1 className="font-medium text-sm tracking-wide text-zinc-200">Workspace</h1>
        </div>
        <nav className="flex-1 px-4">
          <ul className="space-y-1 text-sm text-zinc-400">
            <li className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors bg-white/5 text-zinc-200 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Session {sessionId.substring(0,6)}
            </li>
            <li className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-white/5 hover:text-zinc-200 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-transparent border border-zinc-600" />
              Past Threads
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-[#09090b] to-[#000000]">
        
        {/* Messages Feed */}
        <ChatContainerRoot className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 space-y-12 scroll-smooth custom-scrollbar">
          <ChatContainerContent>
          {groupedMessages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full flex flex-col items-center justify-center text-zinc-500"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm">
                <Sparkles className="w-7 h-7 text-zinc-400" />
              </div>
              <h2 className="text-lg md:text-xl font-medium text-zinc-200 mb-2">How can I help you today?</h2>
              <p className="text-xs md:text-sm">Enter a prompt to initialize the agent.</p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {groupedMessages.map((group, idx) => {
              const userText = group.userMsg ? group.userMsg.content : "";
              const textResponses = group.agentResponses.filter(r => r.type === 'text');
              const combinedText = textResponses.map(r => r.content).join('\n\n');
              const words = combinedText.split(/\s+/).filter(w => w.length > 0);
              const isGroupStreaming = isProcessing && idx === groupedMessages.length - 1;
              const tracesAndApprovals = group.agentResponses.filter(r => r.type !== 'text');

              return (
                <motion.div 
                  key={group.userMsg ? group.userMsg.id : `group-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full max-w-4xl mx-auto flex flex-col"
                >
                  {/* Assistant UI Message Pair */}
                  {(userText || words.length > 0) && (
                    <div className="mb-4">
                      <MessagePair 
                        userMessage={userText}
                        words={words}
                        visibleWords={words.length}
                        streaming={isGroupStreaming && words.length > 0}
                      />
                    </div>
                  )}

                  {/* Render Traces and Approvals underneath the message pair */}
                  {tracesAndApprovals.length > 0 && (
                    <div className="flex flex-col gap-3 pl-4 border-l border-white/10 ml-2 mt-2">
                      {tracesAndApprovals.map((msg) => {
                        const isExpanded = expandedTraces[msg.id];

                        if (msg.type === 'trace') {
                          return (
                            <div key={msg.id} className="w-full max-w-2xl bg-transparent border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                              <button 
                                onClick={() => toggleTrace(msg.id)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors focus:outline-none group/btn"
                              >
                                <div className="flex items-center gap-3 text-zinc-300 font-mono text-xs tracking-wide">
                                  <motion.div 
                                    animate={{ rotate: isExpanded ? 90 : 0 }} 
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                                  </motion.div>
                                  {getToolIcon(msg.toolName || msg.content)}
                                  <span className="truncate max-w-[200px] md:max-w-[400px]">
                                    {msg.toolName || (msg.content || 'Processing...')}
                                  </span>
                                </div>
                                
                                <span className="flex items-center gap-2">
                                  {msg.status === 'success' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                  {msg.status === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                                  {(!msg.status || (msg.status !== 'success' && msg.status !== 'error')) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                  )}
                                </span>
                              </button>
                              
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 bg-black/40 font-mono text-xs overflow-x-auto border-t border-white/5">
                                      {msg.codeSnippet && (
                                        <pre className="text-zinc-300 mb-4 p-3 bg-black/60 rounded-lg border border-white/5"><code className="text-emerald-400/90">{msg.codeSnippet}</code></pre>
                                      )}
                                      <div className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                        {msg.output || msg.content || 'No output details.'}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        }

                        if (msg.type === 'approval') {
                          return (
                            <div key={msg.id} className="w-full max-w-2xl bg-black/40 border border-amber-500/20 rounded-xl overflow-hidden shadow-lg backdrop-blur-md relative">
                              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />
                              <div className="p-5 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-amber-500 text-xs md:text-sm mb-1 tracking-wide">{msg.actionTitle || 'Permission Required'}</h3>
                                  <p className="text-[10px] md:text-xs text-amber-200/70 leading-relaxed max-w-lg">{msg.details || msg.content}</p>
                                </div>
                              </div>
                              
                              {(!msg.status || msg.status === 'pending') ? (
                                <div className="px-5 py-3 bg-white/[0.02] flex justify-end gap-2 border-t border-white/5">
                                  <button 
                                    onClick={() => handleApproval(msg.id, false)}
                                    className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
                                  >
                                    Deny
                                  </button>
                                  <button 
                                    onClick={() => handleApproval(msg.id, true)}
                                    className="px-4 py-2 text-xs font-medium text-amber-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors focus:outline-none shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                  >
                                    Approve Action
                                  </button>
                                </div>
                              ) : (
                                <div className={`px-5 py-3 flex items-center gap-2 text-xs font-medium border-t ${
                                  msg.status === 'approved' 
                                    ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' 
                                    : 'border-rose-500/20 text-rose-400 bg-rose-500/5'
                                }`}>
                                  {msg.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  Action {msg.status === 'approved' ? 'Approved' : 'Rejected'}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <ChatContainerScrollAnchor ref={messagesEndRef} className="h-4" />
          </ChatContainerContent>
        </ChatContainerRoot>

        {/* Floating Minimal Input Bar (Prompt-Kit) */}
        <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-3xl relative"
          >
            <div className="absolute inset-0 bg-white/5 rounded-full blur-xl transition-opacity opacity-50" />
            
            <PromptInput
              value={input}
              onValueChange={setInput}
              onSubmit={handleSubmit}
              disabled={isProcessing}
              className="bg-[#09090b]/80 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/50 text-zinc-100 rounded-full pl-6 pr-2 py-2 flex items-center"
            >
              <PromptInputTextarea 
                placeholder={isProcessing ? "Agent is processing..." : "Ask the agent anything..."} 
                className="text-xs md:text-sm !h-auto placeholder:text-zinc-600 focus:outline-none"
              />
              <PromptInputActions className="ml-2 mr-1">
                <PromptInputAction tooltip="Send Message">
                  <button 
                    onClick={handleSubmit}
                    disabled={!input.trim() || isProcessing}
                    className="p-3 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center justify-center focus:outline-none shadow-sm disabled:shadow-none shrink-0"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>
          </motion.div>
        </div>

      </main>
      
      {/* Global minimal scrollbar styles for this component */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
