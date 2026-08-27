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
  Command
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockChats = [
  { id: 1, label: 'Why use Nuxt UI?', date: 'Today' },
  { id: 2, label: 'Help me create a Vue composable', date: 'Today' },
  { id: 3, label: 'Tell me more about UnJS', date: 'Yesterday' },
  { id: 4, label: 'Why should I consider VueUse?', date: 'Yesterday' },
  { id: 5, label: 'Tailwind CSS best practices', date: 'Previous 7 Days' },
  { id: 6, label: 'What is the weather in Bordeaux?', date: 'Previous 7 Days' },
  { id: 7, label: 'Show me a chart of sales data', date: 'Previous 30 Days' }
];

export const Sidebar = ({ isCollapsed, toggleSidebar, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !isCollapsed || isHovered;

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
          "shrink-0 relative h-screen z-40",
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
            "bg-zinc-50 dark:bg-[#0c0c0e] dim:bg-zinc-950",
            isHovered && isCollapsed
              ? "absolute left-0 top-3 bottom-3 rounded-r-xl border-r border-y border-black/10 dark:border-white/10 dim:border-white/10 shadow-[10px_10px_40px_rgba(0,0,0,0.3)] dark:shadow-[10px_10px_40px_rgba(0,0,0,0.7)] dim:shadow-[10px_10px_40px_rgba(0,0,0,0.5)] z-50"
              : "relative h-screen border-r border-black/5 dark:border-[#26262b] dim:border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] dim:shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
          )}
        >
          <div className="w-full flex flex-col h-full">
            {/* Header */}
            <div className="p-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#c084fc] to-[#7e22ce] flex items-center justify-center text-white text-xs shadow-lg shadow-purple-900/20">
                  ✦
                </div>
                <h1 className="font-semibold text-[15px] tracking-wide text-zinc-900 dark:text-gray-100 dim:text-white transition-colors">TrueForge</h1>
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
              <button className="w-full flex items-center gap-3 text-[14px] p-2.5 rounded-lg transition-all group border border-purple-200 dark:border-[#3b2354]/50 dim:border-[#3b2354]/50 bg-purple-50 dark:bg-[#2a1744]/40 dim:bg-[#2a1744]/40 hover:bg-purple-100 dark:hover:bg-[#2a1744] dim:hover:bg-[#2a1744] text-zinc-800 dark:text-gray-200 dim:text-gray-200">
                <span className="text-[#c084fc] group-hover:text-purple-600 dark:group-hover:text-white dim:group-hover:text-white transition-colors">＋</span>
                <span className="font-medium">New Agent Session</span>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
              <div>
                <h3 className="text-[11px] font-bold text-zinc-400 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Today</h3>
                <ul className="space-y-0.5">
                  {mockChats.filter(c => c.date === 'Today').map(chat => (
                    <li key={chat.id}>
                      <button className="w-full text-left text-[13px] text-zinc-600 dark:text-gray-300 dim:text-gray-300 hover:text-zinc-900 dark:hover:text-white dim:hover:text-white bg-zinc-100 dark:bg-[#1a1a1e] dim:bg-white/5 hover:bg-zinc-200 dark:hover:bg-[#26262b] dim:hover:bg-white/10 px-2 py-1.5 rounded-md truncate transition-colors">
                        {chat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-zinc-400 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Yesterday</h3>
                <ul className="space-y-0.5">
                  {mockChats.filter(c => c.date === 'Yesterday').map(chat => (
                    <li key={chat.id}>
                      <button className="w-full text-left text-[13px] text-zinc-500 dark:text-gray-400 dim:text-gray-400 hover:text-zinc-900 dark:hover:text-white dim:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#26262b] dim:hover:bg-white/5 px-2 py-1.5 rounded-md truncate transition-colors">
                        {chat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-zinc-400 dark:text-gray-500 dim:text-gray-500 uppercase tracking-wider mb-2 px-2 transition-colors">Previous 7 Days</h3>
                <ul className="space-y-0.5">
                  {mockChats.filter(c => c.date === 'Previous 7 Days').map(chat => (
                    <li key={chat.id}>
                      <button className="w-full text-left text-[13px] text-zinc-500 dark:text-gray-400 dim:text-gray-400 hover:text-zinc-900 dark:hover:text-white dim:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#26262b] dim:hover:bg-white/5 px-2 py-1.5 rounded-md truncate transition-colors">
                        {chat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-black/5 dark:border-[#26262b] dim:border-white/5 bg-zinc-100/50 dark:bg-[#0a0a0c] dim:bg-black/20 hover:bg-zinc-200/50 dark:hover:bg-[#111114] dim:hover:bg-black/40 cursor-pointer transition-colors mt-auto">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-[#1e122b] dim:bg-[#1e122b] flex items-center justify-center text-[#c084fc] text-xs font-bold border border-purple-200 dark:border-[#3b2354] dim:border-[#3b2354]">US</div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-medium text-zinc-900 dark:text-gray-200 dim:text-white transition-colors">User Session</span>
                    <span className="text-[11px] text-zinc-500 dark:text-gray-500 dim:text-gray-400 transition-colors">Connected</span>
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
