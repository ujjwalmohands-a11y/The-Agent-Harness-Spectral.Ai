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
  TestTube
} from 'lucide-react';
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "@/components/ui/chat-container";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { BorderBeam } from "@/components/ui/border-beam";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/apple-liquid-glass-switcher";
import { cn } from "@/lib/utils";
import { TrueForge } from '@truefoundry/trueforge-sdk';

const tfClient = new TrueForge({ baseUrl: import.meta.env.VITE_TRUEFORGE_URL || '/' });

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function Chat() {
  // State for TrueForge backend integration
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);
  const hasCreatedSession = useRef(false);
  const mockTimerRef = useRef(null);

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
    if (pendingApproval?.isMock || executingAction || mockTimerRef.current) {
      clearMockState();
    } else if (!isProcessing) {
      // Only start new mock when nothing real is running
      setExecutingAction({
        actionName: 'Executing diagnostics...',
        steps: [
          { text: 'Read `package.json`', status: 'done' },
          { text: 'Analyzing dependency tree...', status: 'loading' }
        ]
      });
      mockTimerRef.current = setTimeout(() => {
        mockTimerRef.current = null;
        setExecutingAction(null);
        setPendingApproval({
          isMock: true,
          actionTitle: 'Irreversible Action Pending',
          details: 'I am about to execute the following database drop:',
          code: 'DROP TABLE production_users;',
          emailPreview: null
        });
      }, 2500);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingApproval]);

  const processTrueForgeStream = async (stream, botMsgId) => {
    let currentText = "";
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
      } else if (event.type === 'model.message.delta' && event.content) {
        currentText += event.content;
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, content: currentText } : msg));
      } else if (event.type === 'turn.done' && event.state?.status === 'error') {
        currentText += `\n\n[Backend Error: ${event.state.message}]\n\n*Note: If you see a reasoning_content error, the TrueForge backend currently has a bug with multi-turn chat for this model.*`;
        setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, content: currentText } : msg));
      }
    }
  };

  const submitMessage = async (textPayload) => {
    if (!textPayload || !textPayload.trim()) return;

    // Clear any active mock state before starting real backend work
    clearMockState();

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
            name: 'notion-agent'
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

  return (
    <div className="flex h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-gray-200 font-sans dark:selection:bg-[#c084fc]/30 overflow-hidden transition-colors duration-500 delay-75">

      {/* Sidebar */}
      <Sidebar
        isCollapsed={!isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-50 dark:bg-[#09090b] transition-colors duration-500 delay-75">



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
                className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center space-y-8 mt-12"
              >
                {/* Welcome Greeting */}
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-white dark:bg-[#1a1a1f] dim:bg-white/5 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 border border-zinc-200 dark:border-gray-800 dim:border-white/10 shadow-lg dark:ring-1 dark:ring-white/5">
                    🤖
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-800 dark:text-gray-200 dim:text-white">How can I help you today?</h2>
                  <p className="text-zinc-500 dark:text-gray-500 dim:text-gray-300 text-sm">I can execute code, analyze databases, or draft documents.</p>
                </div>

                {/* Quick Action Capability Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-4">
                  {[
                    { title: "Analyze repository", desc: "Scan for unused dependencies", prompt: "Please analyze the repository and scan for unused dependencies." },
                    { title: "Debug error log", desc: "Find the root cause of a crash", prompt: "I have a crash log, can you help me find the root cause?" },
                    { title: "Generate API", desc: "Draft a basic Express.js server", prompt: "Please generate a basic Express.js server API." },
                    { title: "Run diagnostics", desc: "Check current system health", prompt: "Run system diagnostics to check current health." }
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => submitMessage(action.prompt)}
                      disabled={isProcessing || !!pendingApproval}
                      className={cn(
                        "flex flex-col text-left p-4 rounded-xl border transition-colors duration-500 delay-150 group shadow-sm",
                        isProcessing || pendingApproval
                          ? "border-zinc-200 dark:border-gray-800 dim:border-white/10 bg-zinc-50 dark:bg-[#1a1a1f]/50 dim:bg-white/3 opacity-50 cursor-not-allowed"
                          : "border-zinc-200 dark:border-gray-800 dim:border-white/10 bg-white dark:bg-[#1a1a1f] dim:bg-white/5 hover:bg-zinc-50 dark:hover:bg-gray-800/80"
                      )}
                    >
                      <span className="text-sm font-medium text-zinc-700 dark:text-gray-200 dim:text-white mb-1 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-500 delay-150">{action.title}</span>
                      <span className="text-xs text-zinc-500 dark:text-gray-500 dim:text-gray-400">{action.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full max-w-4xl mx-auto flex flex-col"
                >
                  {msg.role === 'user' ? (
                    <Message className="justify-end mb-6 w-full mt-4">
                      <MessageContent role="user">
                        {msg.content}
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message className="mb-6 w-full max-w-3xl">
                      <MessageAvatar
                        src="/deepseek_logo.png"
                        fallback={<Sparkles className="w-4 h-4 text-primary" />}
                        className="bg-secondary"
                      />
                      <MessageContent role="system" className="mt-1">
                        {msg.content}
                      </MessageContent>
                    </Message>
                  )}
                </motion.div>
              ))}

              {/* Transparency Stepper (Phase 3) */}
              {executingAction && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-4 w-full max-w-4xl mx-auto mt-4 mb-6"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs shrink-0 font-bold shadow-sm">TF</div>

                  <div className="flex-1 space-y-3 pt-1">
                    <div className="rounded-xl border border-zinc-200 dark:border-gray-800 bg-white dark:bg-[#121214] overflow-hidden text-sm shadow-md">
                      <button className="w-full flex items-center justify-between p-3 text-zinc-500 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-gray-800/30 transition">
                        <div className="flex items-center gap-3">
                          <span className="animate-spin text-purple-500">↻</span>
                          <span className="font-medium text-zinc-900 dark:text-gray-200">{executingAction.actionName}</span>
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-gray-500">▼</span>
                      </button>

                      <div className="px-4 pb-4 pt-2 border-t border-zinc-100 dark:border-gray-800/50 space-y-2 font-mono text-[13px]">
                        {executingAction.steps?.map((step, idx) => (
                          <div key={idx} className={`flex items-center gap-3 ${step.status === 'loading' ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/10 p-1 -ml-1 rounded' : 'text-zinc-500 dark:text-gray-400'}`}>
                            {step.status === 'loading' ? <span className="animate-pulse">▶</span> : <span className="text-green-500">✔</span>}
                            {step.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
        <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-10 pt-12 pointer-events-none transition-colors duration-500 delay-[225ms]">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-2xl relative pointer-events-auto"
          >
            <div className={`w-full relative rounded-2xl bg-white dark:bg-[#111114] border border-black/10 dark:border-[#26262b] transition-all duration-500 delay-[225ms] shadow-2xl dark:shadow-black/50 ${pendingApproval
                ? 'shadow-[0_0_20px_rgba(245,158,11,0.25)] dark:shadow-[0_0_25px_rgba(245,158,11,0.3)] dark:ring-1 dark:ring-amber-500/50'
                : executingAction
                  ? 'shadow-[0_0_20px_rgba(168,85,247,0.2)] dark:shadow-[0_0_25px_rgba(168,85,247,0.25)] dark:ring-1 dark:ring-purple-500/50'
                  : 'focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)] dark:focus-within:border-[#3b2354] dark:focus-within:ring-1 dark:focus-within:ring-[#3b2354]'
              }`}>
              <BorderBeam size="md" colorVariant="colorful">
                <div className="w-full">
                  <PromptInputBox
                    onSend={submitMessage}
                    isLoading={isProcessing || pendingApproval || executingAction}
                    placeholder={executingAction ? "Agent is processing..." : pendingApproval ? "Awaiting your approval..." : "Ask the agent anything..."}
                  />
                </div>
              </BorderBeam>
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
