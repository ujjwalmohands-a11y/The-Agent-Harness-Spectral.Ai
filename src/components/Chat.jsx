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
  Check,
  ChevronRight,
  FileText
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
import WorkspaceFiles from './WorkspaceFiles';


const tfClient = new TrueForge({ baseUrl: import.meta.env.VITE_TRUEFORGE_URL || '/' });


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

const ReasoningToggle = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-purple-600/70 hover:text-purple-700 dark:text-purple-400/70 dark:hover:text-purple-300 transition-colors"
      >
        <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
        Reasoning
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-4 py-1.5 border-l-2 border-purple-100 dark:border-purple-900/30 ml-[5px] mt-1.5 space-y-2 opacity-80">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Chat() {
  // State for TrueForge backend integration
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);

  const workspaceFiles = React.useMemo(() => {
    const allFiles = [];
    messages.forEach(m => {
      if (m.files) {
        m.files.forEach(f => {
          allFiles.push({
            name: f.name,
            sizeFormatted: (f.size / 1024).toFixed(1) + ' KB',
            type: f.type,
            source: 'user',
            rawFile: f
          });
        });
      }
    });
    // Add mock agent file for demonstration
    allFiles.push({
      name: 'cleaned_data.csv',
      sizeFormatted: '1.2 KB',
      type: 'text/csv',
      source: 'agent',
      url: '/cleaned_data.csv'
    });
    return allFiles;
  }, [messages]);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);
  const hasCreatedSession = useRef(false);
  const mockTimerRef = useRef(null);

  // Tool execution tracking
  const [isToolsActive, setIsToolsActive] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedDraft, setEditedDraft] = useState({ to: '', subject: '', body: '' });
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
    if (pendingApproval?.isMock || mockTimerRef.current) {
      clearMockState();
      setIsToolsActive(false);
    } else if (!isProcessing) {
      // Only start new mock when nothing real is running
      setIsToolsActive(true);
      const mockMsgId = generateId();
      setMessages(prev => [...prev, {
        id: mockMsgId,
        role: 'bot',
        content: '',
        toolSteps: [
          { stepId: 'mock-1', toolName: 'notion', status: 'completed', message: 'Connected to Notion workspace' },
          { stepId: 'mock-2', toolName: 'notion', status: 'running', message: 'Searching database...' }
        ]
      }]);

      mockTimerRef.current = setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === mockMsgId ? {
          ...m,
          toolSteps: m.toolSteps.map(s => s.stepId === 'mock-2' ? { ...s, status: 'completed', message: 'Found 3 pages' } : s).concat({ stepId: 'mock-3', toolName: 'gmail', status: 'running', message: 'Drafting email...' })
        } : m));

        mockTimerRef.current = setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === mockMsgId ? {
            ...m,
            toolSteps: m.toolSteps.map(s => s.stepId === 'mock-3' ? { ...s, status: 'completed', message: 'Draft ready' } : s)
          } : m));
          setIsToolsActive(false);

          mockTimerRef.current = setTimeout(() => {
            mockTimerRef.current = null;
            setPendingApproval({
              isMock: true,
              actionTitle: 'Action Required',
              details: 'The agent needs your permission to execute the following command:',
              code: 'rm -rf /some/directory'
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
      let currentBotMsg = null;
      events.slice().reverse().forEach(ev => {
        if (ev.event.type === 'turn.created') {
          const userMsg = ev.event.input?.find(i => i.type === 'user.message');
          if (userMsg) {
            let cleanContent = userMsg.content;

            // Strip out SYSTEM prompt injections
            cleanContent = cleanContent.replace(/\n\n\[SYSTEM:.*?\]/gs, '');

            // Replace verbose approval/rejection payloads with generic status
            if (cleanContent.startsWith('I approve the sandbox action.') || cleanContent.startsWith('I approve the email draft.')) {
              cleanContent = '*Action Approved by user*';
            } else if (cleanContent.startsWith('I rejected the sandbox action.')) {
              cleanContent = '*Action Rejected by user*';
            }

            newMsgs.push({ id: ev.event.id + '-user', role: 'user', content: cleanContent });
          }
        } else if (ev.event.type === 'model.message') {
          // Skip if completely empty
          if (!ev.event.content && (!ev.event.toolCalls || ev.event.toolCalls.length === 0)) return;

          let botContent = ev.event.content || '';

          // Clean up any leaked drafted actions from history
          const sandboxMatch = botContent.match(/<<<SANDBOX_ACTION:(.*?)>>>/s);
          if (sandboxMatch) {
            try {
              const sandboxJson = JSON.parse(sandboxMatch[1]);
              botContent = botContent.replace(sandboxMatch[0], `I have prepared a sandbox action (${sandboxJson.type}). Please review it below.`);
            } catch (e) { }
          }

          const emailMatch = botContent.match(/<<<EMAIL_DRAFT:(.*?)>>>/s);
          if (emailMatch) {
            botContent = botContent.replace(emailMatch[0], `I have prepared a draft. Please review it below.`);
          }

          currentBotMsg = { id: ev.event.id + '-bot', role: 'bot', content: botContent, toolSteps: [] };
          newMsgs.push(currentBotMsg);

          if (ev.event.toolCalls) {
            ev.event.toolCalls.forEach(tc => {
              const func = tc.function || {};
              let toolName = func.name || tc.name || 'tool';
              // If it's a TrueForge tool call, the arguments might contain the actual tool_name
              if (toolName === 'call_tool' && func.arguments) {
                try {
                  const args = JSON.parse(func.arguments);
                  if (args.tool_name) toolName = args.tool_name;
                } catch (e) { }
              }
              currentBotMsg.toolSteps.push({
                stepId: tc.id || generateId(),
                toolName: toolName,
                status: 'completed',
                message: `Executing ${toolName}...`
              });
            });
          }
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

  const processTrueForgeStream = async (stream, initialBotMsgId) => {
    let currentBotMsgId = initialBotMsgId;
    let currentText = "";
    let hasToolsInCurrentMsg = false;
    setIsToolsActive(true);
    for await (const event of stream) {
      if (event.type === 'tool.approval_required') {
        const toolCall = event.toolCalls[0];
        let isEmail = toolCall.function?.name === 'gmail_send_email';
        let emailDetails = null;

        if (isEmail) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            emailDetails = {
              to: args.gmail_to_email || args.to,
              subject: args.gmail_subject || args.subject,
              body: args.gmail_body || args.body,
            };
          } catch (e) { }
        }

        setPendingApproval({
          threadId: event.threadId,
          toolCallId: toolCall.id,
          actionTitle: isEmail ? 'Email Draft Ready' : 'Permission Required',
          details: isEmail ? 'Please review the email draft before sending.' : 'The AI is requesting permission to execute an action.',
          code: isEmail ? null : JSON.stringify(toolCall.function?.arguments, null, 2),
          emailDetails: emailDetails
        });
        break;
      } else if (event.type === 'model.message.delta') {
        if (event.content) {
          // Split into a new message if this text chunk comes AFTER a tool execution
          if (hasToolsInCurrentMsg) {
            currentBotMsgId = generateId();
            currentText = "";
            hasToolsInCurrentMsg = false;
            setMessages(prev => [...prev, { id: currentBotMsgId, role: 'bot', content: '', toolSteps: [] }]);
          }

          currentText += event.content;

          // Check for intercepted sandbox action
          const sandboxMatch = currentText.match(/<<<SANDBOX_ACTION:(.*?)>>>/s);
          if (sandboxMatch) {
            try {
              const sandboxJson = JSON.parse(sandboxMatch[1]);
              currentText = currentText.replace(sandboxMatch[0], `I have prepared a sandbox action (${sandboxJson.type}). Please review it below.`);
              setPendingApproval({
                isInterceptedSandbox: true,
                sandboxDetails: sandboxJson,
                actionTitle: 'Sandbox Action Requires Approval',
                details: `Action: ${sandboxJson.type}\nPath: ${sandboxJson.path || 'N/A'}`,
                code: sandboxJson.content || sandboxJson.script || null,
              });
            } catch (e) {
              console.error("Failed to parse sandbox action JSON", e);
            }
          }

          // Check for intercepted draft
          const draftMatch = currentText.match(/<<<EMAIL_DRAFT:(.*?)>>>/s);
          if (draftMatch) {
            try {
              const draftJson = JSON.parse(draftMatch[1]);
              currentText = currentText.replace(draftMatch[0], 'I have prepared a draft. Please review it below.');
              setPendingApproval({
                isInterceptedDraft: true,
                actionTitle: 'Email Draft Ready',
                details: 'Please review the email draft before sending.',
                code: null,
                emailDetails: draftJson
              });
            } catch (e) { }
          }

          setMessages(prev => prev.map(msg => msg.id === currentBotMsgId ? { ...msg, content: currentText } : msg));
        }
        if (event.toolCalls && event.toolCalls.length > 0) {
          hasToolsInCurrentMsg = true;
          const tc = event.toolCalls[0];
          if (tc.id) { // New tool call started
            const stepId = tc.id;
            const toolName = tc.function?.name || tc.toolInfo?.name || 'tool';
            const msg = `Executing ${toolName}...`;
            const args = tc.function?.arguments || '';
            setMessages(prev => prev.map(m => {
              if (m.id === currentBotMsgId) {
                const steps = m.toolSteps || [];
                const existing = steps.find(s => s.stepId === stepId);
                if (existing) return m;
                return { ...m, toolSteps: [...steps, { stepId, toolName, status: 'running', requestArgs: args }] };
              }
              return m;
            }));
          } else if (tc.function?.arguments) {
            // Append arguments as they stream in
            setMessages(prev => prev.map(m => {
              if (m.id === currentBotMsgId) {
                const steps = m.toolSteps || [];
                return {
                  ...m,
                  toolSteps: steps.map(s => {
                    if (s.status === 'running') {
                      const newArgs = (s.requestArgs || '') + tc.function.arguments;
                      let updatedToolName = s.toolName;
                      // Attempt to parse actual tool name from MCP call payload
                      try {
                        const parsed = JSON.parse(newArgs);
                        if (s.toolName === 'list_tools') {
                          updatedToolName = parsed.mcp_server ? `Listing tools · ${parsed.mcp_server}` : 'Listing tools';
                        } else if (parsed.tool_name) {
                          updatedToolName = parsed.mcp_server ? `${s.toolName}: ${parsed.tool_name} (${parsed.mcp_server})` : `${s.toolName}: ${parsed.tool_name}`;
                        } else if (parsed.mcp_server) {
                          updatedToolName = `${s.toolName} · ${parsed.mcp_server}`;
                        }
                      } catch (e) {
                        // Keep parsing until the JSON is valid (fully streamed)
                      }
                      return { ...s, requestArgs: newArgs, toolName: updatedToolName };
                    }
                    return s;
                  })
                };
              }
              return m;
            }));
          }
        }
      } else if (event.type === 'turn.done') {
        if (event.state?.status === 'error') {
          currentText += `\n\n[Backend Error: ${event.state.message}]\n\n*Note: If you see a reasoning_content error, the TrueForge backend currently has a bug with multi-turn chat for this model.*`;
          setMessages(prev => prev.map(msg => msg.id === currentBotMsgId ? { ...msg, content: currentText } : msg));
        }
        // Mark all running tools as completed when turn finishes
        setMessages(prev => prev.map(m => {
          if (m.toolSteps && m.toolSteps.length > 0) {
            return {
              ...m,
              toolSteps: m.toolSteps.map(s => s.status === 'running' ? { ...s, status: 'completed' } : s)
            };
          }
          return m;
        }));
      }
    }
    setIsToolsActive(false);
  };

  const submitMessage = async (textPayload, files = []) => {
    if ((!textPayload || !textPayload.trim()) && files.length === 0) return;

    let finalPayload = textPayload || "";
    let sdkContentItems = [];

    if (files.length > 0) {
      const fileItems = await Promise.all(
        files.map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              type: 'file',
              name: file.name,
              data: reader.result
            });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        })
      );
      sdkContentItems = fileItems.filter(Boolean);
    }

    const userMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: textPayload, files },
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

      const isEmailTask = /email|gmail|mail|message/i.test(finalPayload);
      const isSandboxTask = /write|edit|delete|script|python|bash|file/i.test(finalPayload);
      let systemInstruction = isEmailTask
        ? "\n\n[SYSTEM: When asked to draft or send an email, DO NOT call any tool immediately. Instead, output your draft EXACTLY in this JSON format: <<<EMAIL_DRAFT:{\"to\":\"...\",\"subject\":\"...\",\"body\":\"...\"}>>> and nothing else. Wait for the user to approve before sending.]"
        : "";
      if (isSandboxTask) {
        systemInstruction += "\n\n[SYSTEM: When asked to perform write, file modification, script execution, or delete operations inside /home/trueforge/, DO NOT call any tool immediately. Instead, output your action EXACTLY in this JSON format: <<<SANDBOX_ACTION:{\"type\":\"tool_name\",\"path\":\"...\",\"content\":\"...\"}>>> and nothing else. Wait for the user to approve before executing.]";
      }

      let finalContent;
      const combinedText = finalPayload + systemInstruction;

      if (sdkContentItems.length > 0) {
        finalContent = [];
        if (combinedText) {
          finalContent.push({ type: 'text', text: combinedText });
        }
        finalContent.push(...sdkContentItems);
      } else {
        finalContent = combinedText;
      }

      const stream = await tfClient.sessions.createTurnStream(currentSessionId, {
        input: [{ type: 'user.message', content: finalContent }]
      });

      const botMsgId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: 'bot', content: '', toolSteps: [] }
      ]);

      await processTrueForgeStream(stream, botMsgId);

      setIsProcessing(false);
      fetchSessions();
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'bot', content: `Error connecting to TrueForge backend: ${error?.message || String(error)}` }
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
      if (pendingApproval.isInterceptedSandbox) {
        if (decision === 'APPROVED') {
          const payload = `I approve the sandbox action. Please proceed to call the appropriate tool exactly as drafted: Type: ${pendingApproval.sandboxDetails.type}, Path: ${pendingApproval.sandboxDetails.path || 'N/A'}, Content/Script: ${pendingApproval.sandboxDetails.content || pendingApproval.sandboxDetails.script || 'N/A'}`;
          const stream = await tfClient.sessions.createTurnStream(sessionId, {
            input: [{ type: 'user.message', content: payload }]
          });
          const botMsgId = generateId();
          setMessages((prev) => [...prev, { id: botMsgId, role: 'bot', content: '', toolSteps: [] }]);
          await processTrueForgeStream(stream, botMsgId);
        } else {
          const payload = "I rejected the sandbox action. Do not proceed. Please make changes based on my next instructions.";
          const stream = await tfClient.sessions.createTurnStream(sessionId, {
            input: [{ type: 'user.message', content: payload }]
          });
          const botMsgId = generateId();
          setMessages((prev) => [...prev, { id: botMsgId, role: 'bot', content: '', toolSteps: [] }]);
          await processTrueForgeStream(stream, botMsgId);
        }
        return;
      }

      if (pendingApproval.isInterceptedDraft) {
        if (decision === 'APPROVED') {
          const payload = `I approve the email draft. Please proceed to call the gmail_send_email tool exactly as drafted: To: ${pendingApproval.emailDetails.to}, Subject: ${pendingApproval.emailDetails.subject}. Body: ${pendingApproval.emailDetails.body}`;
          const stream = await tfClient.sessions.createTurnStream(sessionId, {
            input: [{ type: 'user.message', content: payload }]
          });
          const botMsgId = generateId();
          setMessages((prev) => [...prev, { id: botMsgId, role: 'bot', content: '', toolSteps: [] }]);
          await processTrueForgeStream(stream, botMsgId);
        } else {
          setMessages((prev) => [...prev, { id: generateId(), role: 'bot', content: 'Email draft discarded.' }]);
        }
      } else {
        const stream = await tfClient.sessions.createTurnStream(sessionId, {
          input: [{
            type: 'user.tool_approval',
            threadId: currentThreadId,
            toolCallId: currentApprovalId,
            approval: { status: decision === 'APPROVED' ? 'allow' : 'deny' }
          }]
        });
        const botMsgId = generateId();
        setMessages((prev) => [...prev, { id: botMsgId, role: 'bot', content: '', toolSteps: [] }]);
        await processTrueForgeStream(stream, botMsgId);
      }
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
      "You've returned.",
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
        onOpenFiles={() => setIsFilesOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-50 dark:bg-transparent transition-colors duration-500 delay-75">





        {/* Top Navbar */}
        <header className="h-16 flex items-center px-5 border-b border-black/5 dark:border-[#26262b]/50 shrink-0 bg-white dark:bg-[#09090b] z-20 justify-between transition-colors duration-500 delay-0">
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
            <span className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[11px] font-mono text-green-600 dark:text-[#4ade80] font-medium drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e] shadow-[0_0_6px_#22c55e]"></span>
              </span>
              Active
            </span>
          </div>
          <div className="flex items-center gap-3">
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
                            {msg.files && msg.files.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {msg.files.map((f, i) => (
                                  <div key={i} className="flex items-center gap-3 bg-black/20 p-1.5 pr-5 rounded-[1.15rem] border border-white/5">
                                    {f.type.startsWith('image/') ? (
                                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/20 shrink-0">
                                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl shrink-0">
                                        <FileText className="w-5 h-5 text-white/90" />
                                      </div>
                                    )}
                                    <div className="flex flex-col min-w-0 justify-center">
                                      <span className="truncate max-w-[200px] font-bold text-[13.5px] text-white leading-tight mb-[1px]">{f.name}</span>
                                      <span className="text-[11.5px] text-white/60 leading-tight">{(f.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
                          <div className="flex-1 w-[2px] mt-2 relative">
                            <div
                              className="absolute top-0 left-0 w-full h-full border-l-2 border-dashed border-purple-300 dark:border-purple-500/30"
                              style={{
                                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                              }}
                            />
                          </div>
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

                          {/* Intermediate reasoning messages */}
                          {(() => {
                            const intermediateMsgs = group.msgs.slice(0, -1).filter(msg => msg.content && msg.content.trim());
                            if (intermediateMsgs.length === 0) return null;
                            return (
                              <ReasoningToggle>
                                {intermediateMsgs.map((msg) => (
                                  <MessageContent key={msg.id} role="system" className="mt-0 text-[13px] text-zinc-600 dark:text-zinc-400" markdown={true}>
                                    {msg.content}
                                  </MessageContent>
                                ))}
                              </ReasoningToggle>
                            );
                          })()}

                          {/* Consolidated Tool Steps for this Group */}
                          {(() => {
                            const allToolSteps = group.msgs.flatMap(m => m.toolSteps || []);
                            if (allToolSteps.length === 0) return null;
                            const isActive = allToolSteps.some(s => s.status === 'running');
                            return (
                              <div className="w-full mb-3">
                                <ToolExecutionLog steps={allToolSteps} isActive={isActive} />
                              </div>
                            );
                          })()}

                          {/* Final message in this group */}
                          {(() => {
                            const lastMsg = group.msgs[group.msgs.length - 1];
                            if (!lastMsg.content || !lastMsg.content.trim()) return null;
                            return (
                              <div className="group">
                                <MessageContent role="system" className="mt-0" markdown={true}>
                                  {lastMsg.content}
                                </MessageContent>
                                <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                  <CopyButton text={lastMsg.content} />
                                </MessageActions>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </AnimatePresence>

            {/* Inline Approval Modal / Email Draft */}
            <AnimatePresence>
              {pendingApproval && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-4xl mx-auto px-4 py-3 flex gap-4"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1 relative z-10">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-white dark:bg-[#1a1a1c] border border-purple-200 dark:border-purple-500/30 flex items-center justify-center overflow-hidden shadow-sm">
                        <img src="/Oliver.png" alt="Oliver" className="w-[1.65rem] h-[1.65rem]" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 ml-1" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', letterSpacing: '0.01em' }}>Oliver</span>

                    <div className="mt-1">
                      {pendingApproval.emailDetails ? (
                        <div className="w-full max-w-2xl bg-white dark:bg-[#09090b] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col relative">
                          {/* Header */}
                          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-white dark:bg-[#09090b]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                                <Mail className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-[14px] text-zinc-900 dark:text-zinc-100 tracking-tight">Draft</span>
                            </div>
                            {!isEditingDraft && (
                              <button
                                onClick={() => { setIsEditingDraft(true); setEditedDraft({ ...pendingApproval.emailDetails }); }}
                                className="text-[12.5px] font-medium px-4 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {/* Form Fields - Seamless Style */}
                          <div className="flex flex-col">
                            {/* To Field */}
                            <div className="flex items-center px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-[#09090b]">
                              <span className="text-[13px] text-zinc-400 dark:text-zinc-500 w-16 font-medium">To:</span>
                              {isEditingDraft ? (
                                <input
                                  value={editedDraft.to || ''}
                                  onChange={e => setEditedDraft({ ...editedDraft, to: e.target.value })}
                                  className="flex-1 bg-transparent outline-none text-[14px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-700 font-medium"
                                  placeholder="recipient@example.com"
                                />
                              ) : (
                                <span className="flex-1 text-[14px] text-zinc-900 dark:text-zinc-100 font-medium">
                                  {pendingApproval.emailDetails.to || '(Unknown)'}
                                </span>
                              )}
                            </div>

                            {/* Subject Field */}
                            <div className="flex items-center px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-[#09090b]">
                              <span className="text-[13px] text-zinc-400 dark:text-zinc-500 w-16 font-medium">Subject:</span>
                              {isEditingDraft ? (
                                <input
                                  value={editedDraft.subject || ''}
                                  onChange={e => setEditedDraft({ ...editedDraft, subject: e.target.value })}
                                  className="flex-1 bg-transparent outline-none text-[14px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-700 font-semibold"
                                  placeholder="Email Subject"
                                />
                              ) : (
                                <span className="flex-1 text-[14px] text-zinc-900 dark:text-zinc-100 font-semibold">
                                  {pendingApproval.emailDetails.subject || '(No Subject)'}
                                </span>
                              )}
                            </div>

                            {/* Body Field */}
                            <div className="px-5 py-6 bg-white dark:bg-[#09090b]">
                              {isEditingDraft ? (
                                <textarea
                                  value={editedDraft.body || ''}
                                  onChange={e => setEditedDraft({ ...editedDraft, body: e.target.value })}
                                  className="w-full h-[250px] bg-transparent outline-none text-[14.5px] text-zinc-700 dark:text-zinc-300 custom-scrollbar resize-none leading-relaxed"
                                  placeholder="Write your email here..."
                                />
                              ) : (
                                <div className="text-[14.5px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[40vh] overflow-y-auto custom-scrollbar leading-relaxed">
                                  {pendingApproval.emailDetails.body || '(Empty body)'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="bg-zinc-50/50 dark:bg-[#0c0c0e] px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            {isEditingDraft ? (
                              <>
                                <button
                                  onClick={() => setIsEditingDraft(false)}
                                  className="px-4 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => { setPendingApproval({ ...pendingApproval, emailDetails: editedDraft }); setIsEditingDraft(false); }}
                                  className="px-5 py-2 text-[13px] font-medium bg-black dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-transform shadow-sm"
                                >
                                  Save
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleApproval('REJECTED')}
                                  className="px-4 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Discard
                                </button>
                                <button
                                  onClick={() => handleApproval('APPROVED')}
                                  className="px-5 py-2 text-[13.5px] font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-full transition-all shadow-md flex items-center gap-2 group"
                                >
                                  <Send className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                  Send
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-lg bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-2xl rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-amber-500/20 dark:border-amber-500/10 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                          <div className="p-6 sm:p-8 relative">
                            <div className="flex items-start gap-4 mb-6">
                              <div className="relative shrink-0 mt-0.5">
                                <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full" />
                                <div className="relative w-11 h-11 rounded-full bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                                  <ShieldAlert className="w-5 h-5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <h3 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                                  {pendingApproval.actionTitle || "Permission Required"}
                                </h3>
                                <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                  {pendingApproval.details}
                                </p>
                              </div>
                            </div>

                            {pendingApproval.code && (
                              <div className="mb-8 mt-2 relative group">
                                <div className="absolute -inset-y-3 -inset-x-6 bg-zinc-50/80 dark:bg-black/40 border-y border-zinc-200/50 dark:border-zinc-800/50 pointer-events-none" />
                                <code className="relative block w-full font-mono text-[13px] text-amber-700 dark:text-amber-400/90 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                                  <span className="select-none text-zinc-400 dark:text-zinc-600 mr-3">$</span>
                                  {pendingApproval.code}
                                </code>
                              </div>
                            )}

                            <div className="flex items-center gap-3 pt-2">
                              <button
                                onClick={() => pendingApproval.isMock ? toggleMockApproval() : handleApproval('REJECTED')}
                                className="flex-1 group py-2.5 px-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 font-semibold text-[13.5px] transition-all duration-300 flex items-center justify-center gap-2 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                              >
                                <X className="w-4 h-4 transition-transform group-hover:scale-110" />
                                Deny
                              </button>
                              <button
                                onClick={() => pendingApproval.isMock ? toggleMockApproval() : handleApproval('APPROVED')}
                                style={{ backgroundImage: 'linear-gradient(to right, #f59e0b, #ea580c)' }}
                                className="flex-[1.5] group flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-[13.5px] shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 border border-white/20"
                              >
                                <Check className="w-4 h-4 transition-transform group-hover:scale-110" />
                                Approve Action
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ChatContainerScrollAnchor ref={messagesEndRef} className="h-4" />
          </ChatContainerContent>
        </ChatContainerRoot>

        {/* Bottom Fade Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-[#050505] to-transparent pointer-events-none z-[15]" />

        {/* Floating Minimal Input Bar */}
        <div className={`absolute left-0 right-0 px-4 flex justify-center z-20 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${messages.length === 0
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

      <WorkspaceFiles isOpen={isFilesOpen} onClose={() => setIsFilesOpen(false)} files={workspaceFiles} />

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
