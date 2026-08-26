import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Sparkles,
  PanelLeft,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "@/components/ui/chat-container";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { BorderBeam } from "@/components/ui/border-beam";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/apple-liquid-glass-switcher";
import { TrueForge } from '@truefoundry/trueforge-sdk';

const tfClient = new TrueForge({ baseUrl: '/api/v1' });

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

export default function Chat() {
  // State for TrueForge backend integration
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const hasCreatedSession = useRef(false);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  const hasInitialized = useRef(false);

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
      }
    }
  };

  const submitMessage = async (textPayload) => {
    if (!textPayload || !textPayload.trim()) return;

    const userMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: textPayload },
    ]);
    
    setIsProcessing(true);

    try {
      let currentSessionId = sessionId;

      if (!hasCreatedSession.current) {
        const session = await tfClient.sessions.create({
          agent: {
            spec: {
              model: { 
                name: 'groq-for-trueforge-hackathon/gpt-oss-120b',
                params: { maxTokens: 4096 }
              },
              config: {
                askUserQuestions: { enabled: false },
                generativeUi: { enabled: false }
              }
            }
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
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] dim:bg-zinc-950 text-zinc-900 dark:text-foreground dim:text-zinc-100 font-sans selection:bg-primary/20 overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={!isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-50 dark:bg-[#09090b] dim:bg-zinc-950/80 transition-colors duration-300">
        
        {/* Glassy Orbs for Dim mode */}
        <div className="absolute inset-0 pointer-events-none hidden dim:block overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-signature-gradient blur-[120px] opacity-40 animate-orb"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-signature-gradient blur-[150px] opacity-30 animate-orb-reverse"></div>
        </div>

        {/* Top Navbar */}
        <header className="h-14 flex items-center px-4 border-b border-black/5 dark:border-white/5 dim:border-white/10 shrink-0 bg-zinc-50/80 dark:bg-[#09090b]/80 dim:bg-zinc-950/30 dim:backdrop-blur-xl backdrop-blur-md z-20 justify-between transition-colors duration-300">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mr-3 p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-sm text-zinc-800 dark:text-gray-200 dim:text-white">TrueForge Agent</span>
              <span className="text-xs text-zinc-500 dark:text-gray-500 dim:text-gray-400">Connected</span>
            </div>
          </div>
          <div>
            <ThemeSwitcher />
          </div>
        </header>

        {/* Messages Feed */}
        <ChatContainerRoot className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 space-y-12 scroll-smooth custom-scrollbar">
          <ChatContainerContent>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full flex flex-col items-center justify-center text-muted-foreground mt-24"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-secondary dim:bg-white/5 dim:glass-panel border border-black/10 dark:border-border flex items-center justify-center mb-6 shadow-sm">
                  <Sparkles className="w-7 h-7 text-amber-500 dark:text-primary dim:text-purple-400" />
                </div>
                <h2 className="text-lg md:text-xl font-medium text-zinc-800 dark:text-foreground dim:text-white mb-2">How can I help you today?</h2>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-muted-foreground dim:text-gray-300">Enter a prompt to initialize the TrueForge agent.</p>
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

              {/* Approval Modal rendering inside the chat feed */}
              {pendingApproval && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-4xl mx-auto flex flex-col mb-8"
                >
                  <div className="w-full max-w-2xl bg-black/40 border border-amber-500/20 rounded-xl overflow-hidden shadow-lg backdrop-blur-md relative ml-[52px]">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-500 text-sm mb-1 tracking-wide">{pendingApproval.actionTitle}</h3>
                        <p className="text-xs text-amber-200/70 leading-relaxed max-w-lg">{pendingApproval.details}</p>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-white/[0.02] flex justify-end gap-2 border-t border-white/5">
                      <button
                        onClick={() => handleApproval('REJECTED')}
                        className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/10 rounded-lg transition-colors focus:outline-none"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproval('APPROVED')}
                        className="px-4 py-2 text-xs font-medium text-amber-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors focus:outline-none shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        Approve Action
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <ChatContainerScrollAnchor ref={messagesEndRef} className="h-4" />
          </ChatContainerContent>
        </ChatContainerRoot>

        {/* Floating Minimal Input Bar */}
        <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-10 bg-gradient-to-t from-zinc-50 dark:from-[#09090b] dim:from-zinc-950 via-zinc-50/95 dark:via-[#09090b]/95 dim:via-zinc-950/90 to-transparent pt-12 pointer-events-none transition-colors duration-300">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-2xl relative pointer-events-auto"
          >
            <div className="w-full relative shadow-2xl rounded-2xl bg-white dark:bg-black/60 dim:bg-white/5 dim:glass-panel dim:backdrop-blur-2xl border border-black/10 dark:border-white/10 dim:border-white/20 transition-colors duration-300">
              <BorderBeam size="md" colorVariant="colorful">
                <div className="w-full">
                  <PromptInputBox 
                    onSend={submitMessage}
                    isLoading={isProcessing || pendingApproval}
                    placeholder={isProcessing ? "Agent is processing..." : pendingApproval ? "Awaiting your approval..." : "Ask the agent anything..."}
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
