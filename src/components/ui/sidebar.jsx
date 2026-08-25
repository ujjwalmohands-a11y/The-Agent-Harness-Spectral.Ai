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
  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isCollapsed ? 0 : 260,
        opacity: isCollapsed ? 0 : 1,
      }}
      className={cn(
        "flex flex-col bg-[#09090b] border-r border-white/5 h-screen overflow-hidden shrink-0",
        className
      )}
    >
      <div className="w-[260px] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Command className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-gray-200">Chat</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Top Actions */}
        <div className="px-3 space-y-1 mt-2">
          <button className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors">
            <PlusCircle className="w-4 h-4 text-gray-400" />
            New chat
          </button>
          <button className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md transition-colors">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Search
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-gray-400 border border-white/10">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-gray-400 border border-white/10">K</kbd>
            </div>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto mt-6 px-3 custom-scrollbar">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Today</div>
          {mockChats.filter(c => c.date === 'Today').map(chat => (
            <button key={chat.id} className="w-full text-left px-2 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 rounded-md transition-colors truncate">
              {chat.label}
            </button>
          ))}
          
          <div className="text-xs font-semibold text-gray-500 mt-6 mb-2 px-2">Yesterday</div>
          {mockChats.filter(c => c.date === 'Yesterday').map(chat => (
            <button key={chat.id} className="w-full text-left px-2 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 rounded-md transition-colors truncate">
              {chat.label}
            </button>
          ))}

          <div className="text-xs font-semibold text-gray-500 mt-6 mb-2 px-2">Previous 7 Days</div>
          {mockChats.filter(c => c.date === 'Previous 7 Days').map(chat => (
            <button key={chat.id} className="w-full text-left px-2 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 rounded-md transition-colors truncate">
              {chat.label}
            </button>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-white/5 mt-auto">
          <button className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">US</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-200">User Session</span>
                <span className="text-xs text-gray-500">Free Plan</span>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
