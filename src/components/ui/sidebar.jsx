import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  PlusCircle,
  Settings,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  Trash2,
  Blocks,
  FolderOpen
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Sidebar = ({ isCollapsed, toggleSidebar, className, sessions = [], onNewSession, onSelectSession, onDeleteSession, currentSessionId, onOpenFiles }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !isCollapsed || isHovered;

  const getCategorizedSessions = () => {
    const today = [];
    const yesterday = [];
    const previous7Days = [];
    const older = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    sessions.forEach(session => {
      const date = new Date(session.createdAt);
      if (date >= todayStart) today.push(session);
      else if (date >= yesterdayStart) yesterday.push(session);
      else if (date >= weekStart) previous7Days.push(session);
      else older.push(session);
    });

    return { today, yesterday, previous7Days, older };
  };

  const categorized = getCategorizedSessions();

  const SessionItem = ({ session }) => {
    const isSelected = currentSessionId === session.id;
    return (
      <li key={session.id} className="relative group">
        <button
          onClick={() => onSelectSession(session.id)}
          className={cn(
            "w-full text-left text-[13px] text-zinc-700 dark:text-gray-300 dim:text-gray-300 hover:text-zinc-900 dark:hover:text-white dim:hover:text-white px-2 py-1.5 rounded-md truncate transition-colors pr-8",
            isSelected
              ? "bg-zinc-200/80 dark:bg-[#26262b] dim:bg-white/10 text-zinc-900 dark:text-white font-medium"
              : "hover:bg-zinc-200/50 dark:hover:bg-[#26262b] dim:hover:bg-white/5"
          )}
        >
          {session.title || 'Untitled Session'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteSession(e, session.id); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete session"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </li>
    );
  };

  return (
    <>
      {/* Invisible hover trigger zone when collapsed */}
      {isCollapsed && !isHovered && (
        <div
          className="absolute left-0 top-3 bottom-3 w-4 z-50 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? 0 : 280,
        }}
        className={cn(
          "shrink-0 relative h-screen z-[100]",
          className
        )}
      >
        <motion.div
          animate={{
            x: isExpanded ? 0 : -280,
            opacity: isExpanded ? 1 : 0,
            width: isHovered && isCollapsed ? 260 : 280
          }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "flex flex-col overflow-hidden transition-colors duration-500 delay-150",
            "bg-white dark:bg-[#0c0c0e] dim:bg-zinc-950",
            isHovered && isCollapsed
              ? "absolute left-0 top-3 bottom-3 rounded-r-xl border-r border-y border-black/10 dark:border-white/10 dim:border-white/10 shadow-[10px_10px_40px_rgba(0,0,0,0.3)] dark:shadow-[10px_10px_40px_rgba(0,0,0,0.7)] dim:shadow-[10px_10px_40px_rgba(0,0,0,0.5)] z-[110]"
              : "relative h-screen border-r border-black/10 dark:border-[#26262b] dim:border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] dim:shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
          )}
        >
          <div className="w-full flex flex-col h-full">
            {/* Header */}
            <div className="p-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="/sudharshan prabhu.svg" alt="Sudharshan prabhu" className="w-full h-full object-contain dark:invert-0 invert" />
                </div>
                <h1 className="font-semibold text-[15px] tracking-wide text-zinc-900 dark:text-gray-100 dim:text-white transition-colors">Spectral AI</h1>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:text-gray-500 dark:hover:text-gray-300 dim:text-gray-400 dim:hover:text-white transition-colors"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Top Actions */}
            <div className="px-3 py-3 space-y-1">
              <button onClick={onNewSession} className="w-full flex items-center gap-3 text-[14px] p-2.5 rounded-lg transition-all group border border-purple-200 dark:border-[#3b2354]/50 dim:border-[#3b2354]/50 bg-purple-50 dark:bg-[#2a1744]/40 dim:bg-[#2a1744]/40 hover:bg-purple-100 dark:hover:bg-[#2a1744] dim:hover:bg-[#2a1744] text-zinc-800 dark:text-gray-200 dim:text-gray-200">
                <span className="text-[#c084fc] group-hover:text-purple-600 dark:group-hover:text-white dim:group-hover:text-white transition-colors">＋</span>
                <span className="font-medium">New Agent Session</span>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
              {categorized.today.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Today</h3>
                  <ul className="space-y-0.5">
                    {categorized.today.map(session => <SessionItem key={session.id} session={session} />)}
                  </ul>
                </div>
              )}

              {categorized.yesterday.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Yesterday</h3>
                  <ul className="space-y-0.5">
                    {categorized.yesterday.map(session => <SessionItem key={session.id} session={session} />)}
                  </ul>
                </div>
              )}

              {categorized.previous7Days.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Previous 7 Days</h3>
                  <ul className="space-y-0.5">
                    {categorized.previous7Days.map(session => <SessionItem key={session.id} session={session} />)}
                  </ul>
                </div>
              )}

              {categorized.older.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-500 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Older</h3>
                  <ul className="space-y-0.5">
                    {categorized.older.map(session => <SessionItem key={session.id} session={session} />)}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-3 pb-3">
              <button
                onClick={onOpenFiles}
                className="w-full flex items-center gap-3 text-[14px] p-2.5 rounded-lg transition-all group hover:bg-zinc-200/50 dark:hover:bg-[#111114] dim:hover:bg-white/5 text-zinc-700 dark:text-gray-300 dim:text-gray-300"
              >
                <FolderOpen className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition-colors" />
                <span className="font-medium group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Workspace Files</span>
              </button>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-black/5 dark:border-[#26262b] dim:border-white/5 bg-zinc-100/50 dark:bg-[#0a0a0c] dim:bg-black/20 hover:bg-zinc-200/50 dark:hover:bg-[#111114] dim:hover:bg-black/40 cursor-pointer transition-colors mt-auto">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-[#1e122b] dim:bg-[#1e122b] flex items-center justify-center text-[#c084fc] text-xs font-bold border border-purple-200 dark:border-[#3b2354] dim:border-[#3b2354]">LS</div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[13px] font-mono font-medium text-zinc-900 dark:text-gray-200 dim:text-white transition-colors tracking-tight">Live Session v1.0</span>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c55e] shadow-[0_0_6px_#22c55e]"></span>
                      </span>
                      <span className="text-[11px] font-mono text-green-600 dark:text-[#4ade80] dim:text-[#4ade80] font-medium transition-colors drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">Connected</span>
                    </div>
                  </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-zinc-400 dark:text-gray-500 dim:text-gray-500" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

