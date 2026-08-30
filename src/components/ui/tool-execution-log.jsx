import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, Wrench, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ToolExecutionLog — Real-time tool execution status component.
 *
 * Props:
 *   steps: Array<{ stepId: string, toolName: string, status: 'running' | 'completed' | 'failed', message: string }>
 *   isActive: boolean — whether tools are currently executing
 *   label?: string — accordion header label
 */
export const ToolExecutionLog = ({ steps = [], isActive = false, label }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-expand when tools start running, auto-collapse when done
  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  // Auto-collapse 1.5s after all tools finish
  useEffect(() => {
    if (!isActive && steps.length > 0 && isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive, steps.length]);

  if (steps.length === 0) return null;

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const failedCount = steps.filter(s => s.status === 'failed').length;
  const runningCount = steps.filter(s => s.status === 'running').length;
  const totalSteps = steps.length;

  const headerLabel = label || (
    isActive
      ? `Agent steps · ${runningCount} tool${runningCount !== 1 ? 's' : ''} running`
      : failedCount > 0
        ? `Agent steps · ${failedCount} error${failedCount !== 1 ? 's' : ''}`
        : `Agent steps · ${totalSteps} tool call${totalSteps !== 1 ? 's' : ''}`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      <div className={cn(
        "rounded-xl border overflow-hidden text-sm transition-colors duration-300",
        isActive
          ? "border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20"
          : failedCount > 0
            ? "border-red-200/60 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10"
            : "border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20"
      )}>
        {/* Accordion Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20"
        >
          <div className="flex items-center gap-2.5">
            {/* Status indicator */}
            {isActive ? (
              <div className="relative flex items-center justify-center w-5 h-5">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
            ) : failedCount > 0 ? (
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}

            <span className={cn(
              "text-[13px] font-medium",
              isActive
                ? "text-purple-700 dark:text-purple-300"
                : "text-zinc-600 dark:text-zinc-400"
            )}>
              {headerLabel}
            </span>

            {/* Progress pill */}
            {totalSteps > 0 && (
              <span className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full font-mono tabular-nums",
                isActive
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}>
                {completedCount}/{totalSteps}
              </span>
            )}
          </div>

          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-300",
              isExpanded ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {/* Accordion Body */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 space-y-0.5">
                {steps.map((step, idx) => (
                  <ToolStep key={step.stepId || idx} step={step} index={idx} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * Individual tool execution step row
 */
const ToolStep = ({ step, index }) => {
  const [isRequestExpanded, setIsRequestExpanded] = useState(false);
  const hasRequestArgs = Boolean(step.requestArgs);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        "flex flex-col gap-1.5 py-2 px-1.5 rounded-lg transition-colors duration-300 mb-1",
        step.status === 'running' && "bg-purple-100/30 dark:bg-purple-900/10",
        step.status === 'failed' && "bg-red-50/50 dark:bg-red-950/15",
      )}
    >


      {/* Tool Call Row */}
      <button 
        onClick={() => hasRequestArgs && setIsRequestExpanded(!isRequestExpanded)}
        disabled={!hasRequestArgs}
        className={cn(
          "flex items-center gap-1.5 w-full text-left group",
          hasRequestArgs && "cursor-pointer"
        )}
      >
        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 ml-1">
          <ChevronRight className={cn(
            "w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200",
            hasRequestArgs && "group-hover:text-zinc-600 dark:group-hover:text-zinc-300",
            isRequestExpanded && "rotate-90"
          )} />
        </div>
        
        <div className={cn(
          "flex items-center justify-between flex-1 min-w-0 bg-white/50 dark:bg-black/20 rounded border border-zinc-200/50 dark:border-zinc-800/50 px-2.5 py-1.5 shadow-sm transition-colors",
          hasRequestArgs && "group-hover:bg-white/80 dark:group-hover:bg-black/40"
        )}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Wrench className="w-3 h-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <span className="text-[12.5px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
              {step.toolName}
            </span>
          </div>
          
          <div className="flex-shrink-0 ml-2">
            {step.status === 'running' ? (
              <Loader2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 animate-spin" />
            ) : step.status === 'completed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-500" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            )}
          </div>
        </div>
      </button>

      {/* Request Details Block */}
      <AnimatePresence initial={false}>
        {hasRequestArgs && isRequestExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-6 rounded-lg border border-purple-200/50 dark:border-purple-500/20 bg-white dark:bg-[#111113] overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50/50 dark:bg-purple-500/10 border-b border-purple-100 dark:border-purple-500/20">
                <span className="text-[11.5px] font-medium text-purple-700 dark:text-purple-300">Request</span>
              </div>
              <div className="px-3 py-2 text-[11.5px] font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(step.requestArgs), null, 2);
                  } catch (e) {
                    return step.requestArgs; // Fallback if still streaming or invalid
                  }
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error details */}
      {step.status === 'failed' && step.errorDetail && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-[11px] text-red-500/80 dark:text-red-400/70 mt-1 pl-6 font-mono truncate"
        >
          {step.errorDetail}
        </motion.p>
      )}
    </motion.div>
  );
};
