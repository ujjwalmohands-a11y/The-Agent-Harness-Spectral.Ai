import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Sparkles,
  PanelLeft,
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  X,
  TestTube,
  Copy,
  Check
} from 'lucide-react';
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "@/components/ui/chat-container";
import { Message, MessageAvatar, MessageContent, MessageActions, MessageAction } from "@/components/ui/message";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { BorderBeam } from "@/components/ui/border-beam";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/apple-liquid-glass-switcher";
import { ToolExecutionLog } from "@/components/ui/tool-execution-log";
import { cn } from "@/lib/utils";
import { TrueForge } from '@truefoundry/trueforge-sdk';
import ColorBends from './Hero/ColorBends';
import DotField from './Hero/DotField';

const tfClient = new TrueForge({ baseUrl: import.meta.env.VITE_TRUEFORGE_URL || '/' });

// Trueforge Background Configuration
const config = {
  color: "#06B6D4",
  colors: ["#06b6d4", "#3b82f6", "#2dd4bf"],
  speed: 0.1,
  frequency: 1.1,
  noise: 0.02,
  bandWidth: 0.40,
  rotation: 45,
  intensity: 1.1,
  dotRadius: 1.5,
  dotSpacing: 14,
  bulgeStrength: 67,
  dotOpacity: 0.4,
};

const hexToRgba = (hex, alpha) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const dotGlow = hexToRgba(config.color, config.dotOpacity);
const dotGlowCore = hexToRgba(config.color, config.dotOpacity * 0.5);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <MessageAction tooltip={copied ? "Copied!" : "Copy"}>
      <button onClick={handleCopy} className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-zinc-100 dark:hover:bg-[#26262b] transition-colors">
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </MessageAction>
  );
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const BlinkingLogo = () => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let timeoutId;
    const blink = () => {
      if (isOpen) {
        timeoutId = setTimeout(() => setIsOpen(false), 2000 + Math.random() * 3000);
      } else {
        timeoutId = setTimeout(() => setIsOpen(true), 150);
      }
    };
    blink();
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  return (
    <div className="w-20 h-20 relative flex-shrink-0 dark:bg-white rounded-full p-2 shadow-sm transition-all">
      <img
        src="/Oliver/Oliver.svg"
        alt="Oliver Eyes Open"
        className={`absolute inset-0 w-full h-full object-contain ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <img
        src="/Oliver/Oliver_closed.svg"
        alt="Oliver Eyes Closed"
        className={`absolute inset-0 w-full h-full object-contain ${!isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default function Chat() {
  // State for TrueForge backend integration
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);
  const hasCreatedSession = useRef(false);
  const mockTimerRef = useRef(null);

  // Tool execution tracking
  const [toolSteps, setToolSteps] = useState([]);
  const [isToolsActive, setIsToolsActive] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  const hasInitialized = useRef(false);

  // Clean up mock timer on unmount
  useEffect(() => {
    return () => {
      if (mockTimerRef.current) {
        clearTimeout(mockTimerRef.current);
        mockTimerRef.current = null;
      }
    };
  }, []);

  // Helper to forcefully tear down all mock state and timers
  const clearMockState = () => {
    if (mockTimerRef.current) {
      clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    if (pendingApproval?.isMock) setPendingApproval(null);
    if (executingAction) setExecutingAction(null);
  };

  const toggleMockApproval = () => {
    // Never allow mock to overwrite real backend approval state
    if (pendingApproval && !pendingApproval.isMock) return;

    // Always allow cancelling mock state, even while processing
    if (pendingApproval?.isMock || toolSteps.length > 0 || mockTimerRef.current) {
      clearMockState();
      setToolSteps([]);
      setIsToolsActive(false);
    } else if (!isProcessing) {
      // Only start new mock when nothing real is running
      setIsToolsActive(true);
      setToolSteps([
        { stepId: 'mock-1', toolName: 'notion', status: 'completed', message: 'Connected to Notion workspace' },
        { stepId: 'mock-2', toolName: 'notion', status: 'running', message: 'Searching database...' },
      ]);
      mockTimerRef.current = setTimeout(() => {
        setToolSteps(prev => prev.map(s => s.stepId === 'mock-2' ? { ...s, status: 'completed', message: 'Found 3 pages' } : s));
        setToolSteps(prev => [...prev, { stepId: 'mock-3', toolName: 'gmail', status: 'running', message: 'Drafting email...' }]);

        mockTimerRef.current = setTimeout(() => {
          setToolSteps(prev => prev.map(s => s.stepId === 'mock-3' ? { ...s, status: 'completed', message: 'Draft ready' } : s));
          setIsToolsActive(false);

          mockTimerRef.current = setTimeout(() => {
            mockTimerRef.current = null;
            setPendingApproval({
              isMock: true,
              actionTitle: 'Irreversible Action Pending',
              details: 'I am about to execute the following database drop:',
              code: 'DROP TABLE production_users;',
              emailPreview: null
            });
          }, 1000);
        }, 1500);
      }, 1500);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const res = await tfClient.sessions.list();
      setSessions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    hasCreatedSession.current = false;
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      await tfClient.sessions.delete(id);
      if (sessionId === id) handleNewSession();
      fetchSessions();
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSelectSession = async (id) => {
    setSessionId(id);
    hasCreatedSession.current = true;
    setMessages([]);
    setIsProcessing(true);
    try {
      const res = await tfClient.sessions.listEvents(id);
      const events = res.data || [];
      const newMsgs = [];
      events.slice().reverse().forEach(ev => {
        if (ev.event.type === 'turn.created') {
          const userMsg = ev.event.input?.find(i => i.type === 'user.message');
          if (userMsg) {
            newMsgs.push({ id: ev.event.id + '-user', role: 'user', content: userMsg.content });
          }
        } else if (ev.event.type === 'model.message' && ev.event.content) {
          newMsgs.push({ id: ev.event.id + '-bot', role: 'bot', content: ev.event.content });
        }
      });
      setMessages(newMsgs);
    } catch (e) {
      console.error(e);
      setMessages([{ id: generateId(), role: 'bot', content: 'Failed to load session history.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingApproval]);

  const processTrueForgeStream = async (stream, botMsgId) => {
    let currentText = "";
    setIsToolsActive(true);
    for await (const event of stream) {
      if (event.type === 'tool.approval_required') {
        const toolCall = event.toolCalls[0];
        setPendingApproval({
          threadId: event.threadId,
          toolCallId: toolCall.id,
          actionTitle: 'Permission Required',
          details: 'The AI is requesting permission to execute an action.'
        });
        break;
      } else if (event.type === 'tool.call') {
        // A tool call is starting
        const stepId = event.toolCallId || event.id || generateId();
        const toolName = event.toolName || event.name || 'tool';
        const msg = event.message || `Calling ${toolName}...`;
        setToolSteps(prev => {
          const existing = prev.find(s => s.stepId === stepId);
          if (existing) {
            return prev.map(s => s.stepId === stepId ? { ...s, status: 'running', message: msg } : s);
          }
          return [...prev, { stepId, toolName, status: 'running', message: msg }];
        });
      } else if (event.type === 'tool.result') {
        // A tool call completed
        const stepId = event.toolCallId || event.id;
        const isError = event.error || event.status === 'failed';
        setToolSteps(prev => prev.map(s =>
          s.stepId === stepId
            ? { ...s, status: isError ? 'failed' : 'completed', message: isError ? (event.error || 'Failed') : (event.message || s.message || 'Done'), errorDetail: isError ? event.error : undefined }
            : s
        ));
      } else if (event.type === 'model.message.delta' && event.content) {
        currentText += event.content;
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, content: currentText } : msg));
      } else if (event.type === 'turn.done' && event.state?.status === 'error') {
        currentText += `\n\n[Backend Error: ${event.state.message}]\n\n*Note: If you see a reasoning_content error, the TrueForge backend currently has a bug with multi-turn chat for this model.*`;
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, content: currentText } : msg));
      }
    }
    setIsToolsActive(false);
  };

  const submitMessage = async (textPayload) => {
    if (!textPayload || !textPayload.trim()) return;

    // Clear any active mock state before starting real backend work
    clearMockState();

    // Clear previous tool execution steps for the new turn
    setToolSteps([]);

    const userMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: textPayload },
    ]);

    setIsProcessing(true);

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const session = await tfClient.sessions.create({
          agent: {
            name: 'oliver'
          }
        });
        currentSessionId = session.data.id;
        setSessionId(currentSessionId);
        hasCreatedSession.current = true;
      }

      const stream = await tfClient.sessions.createTurnStream(currentSessionId, {
        input: [{ type: 'user.message', content: textPayload }]
      });

      const botMsgId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: 'bot', content: '' }
      ]);

      await processTrueForgeStream(stream, botMsgId);

      setIsProcessing(false);
      fetchSessions();
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'bot', content: 'Error connecting to TrueForge backend.' }
      ]);
      setIsProcessing(false);
    }
  };

  const handleApproval = async (decision) => {
    if (!pendingApproval) return;

    const statusText = decision === 'APPROVED' ? 'Action Approved' : 'Action Rejected';
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'system', content: `*${statusText} by user*` }
    ]);

    const currentApprovalId = pendingApproval.toolCallId;
    const currentThreadId = pendingApproval.threadId;
    setPendingApproval(null);
    setIsProcessing(true);

    try {
      const stream = await tfClient.sessions.createTurnStream(sessionId, {
        input: [{
          type: 'user.tool_approval',
          threadId: currentThreadId,
          toolCallId: currentApprovalId,
          approval: { status: decision === 'APPROVED' ? 'allow' : 'deny' }
        }]
      });

      const botMsgId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: 'bot', content: '' }
      ]);

      await processTrueForgeStream(stream, botMsgId);
    } catch (error) {
      console.error('Failed to send approval:', error);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'bot', content: 'Error sending approval to backend.' }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true;
      submitMessage(initialPrompt);
      window.history.replaceState({}, document.title);
    }
  }, [initialPrompt]);

  // Use a stable, random 2-3 word greeting
  const randomGreeting = React.useMemo(() => {
    const greetings = [
      "Ah,You've returned.",
      "Let's forge.",
      "Ideas await.",
      "Ready to start?",
      "Start crafting.",
      "Speak your mind."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  return (
    <div className="flex h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-gray-200 font-sans dark:selection:bg-[#c084fc]/30 overflow-hidden transition-colors duration-500 delay-75">

      {/* Sidebar */}
      <Sidebar
        isCollapsed={!isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        currentSessionId={sessionId}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-50 dark:bg-transparent transition-colors duration-500 delay-75">

        {/* Trueforge Background (Dark Mode Only) */}
        <div className="absolute inset-0 z-0 hidden dark:block transition-opacity duration-1000"
             style={{
               background: 'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--theme-color) 20%, #111118) 0%, #050508 100%)',
               '--theme-color': config.color,
               '--theme-c1': config.colors[0],
               '--theme-c2': config.colors[1] || config.colors[0],
               '--theme-glow': hexToRgba(config.color, 0.4),
               '--theme-glow-strong': hexToRgba(config.color, 0.8),
             }}>
          
          <div className="absolute -inset-[5%] z-0 opacity-80 saturate-150 pointer-events-none">
            <ColorBends
              colors={config.colors}
              rotation={config.rotation}
              speed={config.speed}
              scale={1.2}
              frequency={config.frequency}
              intensity={config.intensity}
              noise={config.noise}
              warpStrength={1}
              bandWidth={config.bandWidth * 15}
              transparent={true}
            />
          </div>

          <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
            <DotField
              dotRadius={config.dotRadius || 1.8}
              dotSpacing={config.dotSpacing || 16}
              cursorRadius={400}
              cursorForce={0.15}
              bulgeOnly={true}
              bulgeStrength={config.bulgeStrength || 80}
              glowRadius={0}
              sparkle={true}
              gradientFrom={dotGlow}
              gradientTo={dotGlow}
              glowColor={dotGlowCore}
            />
          </div>

          <div
            className="absolute -inset-[10%] z-0 pointer-events-none mix-blend-overlay opacity-25 animate-noise"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>



        {/* Top Navbar */}
        <header className="h-16 flex items-center px-5 border-b border-black/5 dark:border-[#26262b]/50 shrink-0 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-sm z-20 justify-between transition-colors duration-500 delay-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-md text-zinc-500 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-semibold text-zinc-800 dark:text-gray-200 text-[15px]">TrueForge Agent</h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 text-[11px] text-green-700 dark:text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            {import.meta.env.DEV && (
              <button
                onClick={toggleMockApproval}
                disabled={isProcessing || (pendingApproval && !pendingApproval.isMock)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                  isProcessing || (pendingApproval && !pendingApproval.isMock)
                    ? "text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-50"
                    : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                )}
              >
                <TestTube className="w-3.5 h-3.5" />
                Mock UI
              </button>
            )}

            <ThemeSwitcher />
          </div>
        </header>

        {/* Messages Feed */}
        <ChatContainerRoot className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 space-y-12 scroll-smooth custom-scrollbar relative z-10">
          <ChatContainerContent>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center my-auto min-h-[40vh]"
              >
                {/* Minimal Claude-like Greeting */}
                <div className="flex items-center justify-center gap-4">
                  <BlinkingLogo />
                  <h2
                    className="text-[2rem] font-light text-zinc-900 dark:text-gray-100 dim:text-white tracking-tight"
                    style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
                  >
                    {randomGreeting}
                  </h2>
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {/* Group messages: consecutive bot messages become a single group */}
              {(() => {
                const groups = [];
                let i = 0;
                while (i < messages.length) {
                  const msg = messages[i];
                  if (msg.role === 'user') {
                    groups.push({ type: 'user', msgs: [msg], id: msg.id });
                    i++;
                  } else {
                    // collect all consecutive bot messages
                    const botMsgs = [];
                    while (i < messages.length && messages[i].role !== 'user') {
                      botMsgs.push(messages[i]);
                      i++;
                    }
                    groups.push({ type: 'bot', msgs: botMsgs, id: botMsgs[0].id });
                  }
                }

                return groups.map((group) => {
                  if (group.type === 'user') {
                    const msg = group.msgs[0];
                    return (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full max-w-4xl mx-auto"
                      >
                        <Message className="justify-end mb-6 w-full mt-4">
                          <MessageContent role="user">
                            {msg.content}
                          </MessageContent>
                        </Message>
                      </motion.div>
                    );
                  }

                  // Bot group
                  const isMultiple = group.msgs.length > 1;
                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full max-w-4xl mx-auto mb-6 mt-2"
                    >
                      <div className="flex gap-3 w-full max-w-3xl">
                        {/* Left column: avatar + continuous threading line */}
                        <div className="relative flex-shrink-0 w-12 flex flex-col items-center">
                          {/* Avatar */}
                          <div className="h-12 w-12 rounded-full overflow-hidden border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-white drop-shadow-sm ring-2 ring-purple-100 dark:ring-purple-900/30 flex-shrink-0 z-10">
                            <img
                              src="/Oliver.png"
                              alt="Oliver"
                              className="w-full h-full object-cover scale-125"
                            />
                          </div>
                          {/* Dashed threading line — fades out gracefully at the bottom */}
                          {isMultiple && (
                            <div
                              className="flex-1 mt-2"
                              style={{
                                width: '2px',
                                borderLeft: '2px dashed rgb(168 85 247)',
                                opacity: 0.6,
                                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                              }}
                            />
                          )}
                        </div>

                        {/* Right column: name label + all messages */}
                        <div className="flex-1 flex flex-col gap-0 min-w-0">
                          {/* Character name — Claude-style serif */}
                          <span
                            className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 ml-1"
                            style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', letterSpacing: '0.01em' }}
                          >
                            Oliver
                          </span>

                          {/* All messages in this group */}
                          {group.msgs.map((msg, msgIdx) => (
                            <div key={msg.id} className={cn("group", msgIdx < group.msgs.length - 1 ? "mb-4" : "")}>
                              <MessageContent role="system" className="mt-0">
                                {msg.content}
                              </MessageContent>
                              <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                <CopyButton text={msg.content} />
                              </MessageActions>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })()}

              {/* Tool Execution Log — inline in the chat feed */}
              {toolSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-4xl mx-auto mt-2 mb-4 pl-[60px]"
                >
                  <ToolExecutionLog
                    steps={toolSteps}
                    isActive={isToolsActive}
                  />
                </motion.div>
              )}

              {/* Approval Modal rendering inside the chat feed */}
              {pendingApproval && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="flex gap-4 w-full max-w-4xl mx-auto mt-4 mb-8"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs shrink-0 font-bold shadow-sm">⚠️</div>

                  <div className="flex-1 space-y-3 pt-1">
                    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-[#1a1212] overflow-hidden text-sm shadow-xl p-4 md:p-5">
                      <h3 className="text-red-600 dark:text-red-400 font-semibold mb-2">{pendingApproval.actionTitle || "Irreversible Action Pending"}</h3>
                      <p className="text-zinc-600 dark:text-gray-300 mb-4">{pendingApproval.details}</p>

                      {pendingApproval.code && (
                        <code className="block bg-zinc-100 dark:bg-black/50 p-3 rounded-lg border border-zinc-200 dark:border-gray-800 font-mono text-zinc-600 dark:text-gray-400 mb-5 overflow-x-auto">
                          {pendingApproval.code}
                        </code>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => pendingApproval.isMock ? toggleMockApproval() : handleApproval('APPROVED')}
                          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-md shadow-red-600/20"
                        >
                          Approve & Execute
                        </button>
                        <button
                          onClick={() => pendingApproval.isMock ? toggleMockApproval() : handleApproval('REJECTED')}
                          className="px-5 py-2.5 bg-zinc-100 dark:bg-gray-800 hover:bg-zinc-200 dark:hover:bg-gray-700 text-zinc-700 dark:text-gray-200 rounded-lg font-medium transition border border-zinc-200 dark:border-transparent"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <ChatContainerScrollAnchor ref={messagesEndRef} className="h-4" />
          </ChatContainerContent>
        </ChatContainerRoot>

        {/* Floating Minimal Input Bar */}
        <div className={`absolute left-0 right-0 px-4 flex justify-center z-10 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${messages.length === 0
            ? 'top-[54%] -translate-y-1/2'
            : 'bottom-6 translate-y-0 pt-12'
          }`}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-2xl relative pointer-events-auto"
          >
            <div className={`w-full relative rounded-2xl transition-all duration-700 shadow-2xl dark:shadow-black/50 ${messages.length === 0
                ? 'bg-white dark:bg-[#1a1a1c] border border-purple-200/80 dark:border-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(192,132,252,0.1)] scale-105'
                : 'bg-white dark:bg-[#111114] border border-black/10 dark:border-[#26262b] scale-100'
              } ${pendingApproval
                ? 'shadow-[0_0_20px_rgba(245,158,11,0.25)] dark:shadow-[0_0_25px_rgba(245,158,11,0.3)] dark:ring-1 dark:ring-amber-500/50'
                : isToolsActive
                  ? 'shadow-[0_0_20px_rgba(168,85,247,0.2)] dark:shadow-[0_0_25px_rgba(168,85,247,0.25)] dark:ring-1 dark:ring-purple-500/50'
                  : 'focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] dark:focus-within:border-[#3b2354] dark:focus-within:ring-1 dark:focus-within:ring-[#3b2354]'
              }`}>
              {messages.length === 0 ? (
                <BorderBeam size="md" colorVariant="colorful">
                  <div className="w-full">
                    <PromptInputBox
                      onSend={submitMessage}
                      isLoading={isProcessing || pendingApproval || isToolsActive}
                      placeholder={isToolsActive ? "Agent is processing..." : pendingApproval ? "Awaiting your approval..." : "Ask the agent anything..."}
                    />
                  </div>
                </BorderBeam>
              ) : (
                <div className="w-full">
                  <PromptInputBox
                    onSend={submitMessage}
                    isLoading={isProcessing || pendingApproval || isToolsActive}
                    placeholder={isToolsActive ? "Agent is processing..." : pendingApproval ? "Awaiting your approval..." : "Ask the agent anything..."}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </main>

      {/* Global minimal scrollbar styles for this component */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
