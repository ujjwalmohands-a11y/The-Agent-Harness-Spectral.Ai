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

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
};

export default function Chat() {
  // State for TrueForge backend integration
  const [messages, setMessages] = useState([]);
  const [sessionId] = useState(() => generateId());
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  
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

  const submitMessage = async (textPayload) => {
    if (!textPayload || !textPayload.trim()) return;

    const userMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: textPayload },
    ]);
    
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:8000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textPayload, sessionId }),
      });

      const data = await response.json();

      if (data.status === 'REQUIRES_APPROVAL') {
        setPendingApproval({ 
          approvalId: data.approvalId,
          actionTitle: data.actionTitle || 'Permission Required',
          details: data.details || 'The AI is requesting permission to execute an action.'
        });
      } else {
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: 'bot', content: data.response || 'Task completed.' }
        ]);
        setIsProcessing(false);
      }
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
    
    // Optimistically record the decision in chat
    const statusText = decision === 'APPROVED' ? 'Action Approved' : 'Action Rejected';
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'system', content: `*${statusText} by user*` }
    ]);
    
    const currentApprovalId = pendingApproval.approvalId;
    setPendingApproval(null);
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:8000/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvalId: currentApprovalId, 
          decision: decision 
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'bot', content: data.response || `Action was ${decision.toLowerCase()}.` }
      ]);
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
    <div className="flex h-screen bg-[#09090b] text-foreground font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={!isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#09090b]">
        
        {/* Top Navbar */}
        <header className="h-14 flex items-center px-4 border-b border-white/5 shrink-0 bg-[#09090b]/80 backdrop-blur-md z-20">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mr-3 p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-200">TrueForge Agent</span>
            <span className="text-xs text-gray-500">Connected</span>
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
                <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6 shadow-sm">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg md:text-xl font-medium text-foreground mb-2">How can I help you today?</h2>
                <p className="text-xs md:text-sm">Enter a prompt to initialize the TrueForge agent.</p>
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
        <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-10 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pt-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-2xl relative"
          >
            <div className="w-full relative shadow-2xl rounded-2xl">
              <BorderBeam size="md" colorVariant="colorful">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl w-full">
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
