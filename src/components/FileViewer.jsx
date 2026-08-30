import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileViewer({ file, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isImage = file?.type?.startsWith('image/') || file?.name?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isCSV = file?.name?.endsWith('.csv') || file?.type === 'text/csv';

  useEffect(() => {
    if (!file) return;

    if (!isImage) {
      setLoading(true);
      setError(null);
      
      const fetchFileContent = async () => {
        try {
          if (file.url) {
            const res = await fetch(file.url);
            if (!res.ok) throw new Error("Failed to fetch file");
            const text = await res.text();
            // Remove null bytes, BOM, and replacement characters
            setContent(text.replace(/[\0\uFEFF\uFFFD]/g, ''));
          } else if (file.rawFile) {
            const text = await file.rawFile.text();
            setContent(text.replace(/[\0\uFEFF\uFFFD]/g, ''));
          } else {
            throw new Error("No valid file source provided");
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchFileContent();
    }
  }, [file, isImage]);

  // A robust custom CSV parser handling quotes
  const parseCSV = (text) => {
    if (!text) return [];
    
    const result = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++; // Skip \n in \r\n
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell)) {
          result.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell)) {
        result.push(currentRow);
      }
    }
    
    return result;
  };

  const renderCSV = () => {
    const allRows = parseCSV(content);
    if (!allRows || allRows.length === 0) return <div className="p-8 text-center text-zinc-500">Empty CSV</div>;
    
    // Performance optimization: limit rendering to 100 rows to prevent extreme lag
    const MAX_ROWS = 100;
    const isTruncated = allRows.length > MAX_ROWS + 1;
    const rows = allRows.slice(0, MAX_ROWS + 1);

    const headers = rows[0];
    const data = rows.slice(1);

    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-[#0c0c0e]">
        {isTruncated && (
          <div className="shrink-0 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs px-4 py-2 border-b border-blue-100 dark:border-blue-900/30 flex items-center justify-center font-medium">
            Showing first {MAX_ROWS} rows for performance. The file contains {allRows.length - 1} rows in total.
          </div>
        )}
        <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-[#151515] border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-10">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 last:border-0 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 whitespace-nowrap max-w-[300px] truncate" title={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  const renderText = () => (
    <div className="w-full h-full overflow-auto custom-scrollbar p-6 bg-white dark:bg-[#0c0c0e]">
      <pre className="text-[13px] font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap break-words">
        {content}
      </pre>
    </div>
  );

  return (
    <AnimatePresence>
      {file && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-6xl h-[85vh] bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <header className="shrink-0 h-14 bg-white dark:bg-[#0c0c0e] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="font-semibold text-zinc-900 dark:text-white truncate">
                  {file.name}
                </span>
                <span className="text-[12px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                  {file.sizeFormatted}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                     const downloadUrl = file.url || (file.rawFile ? URL.createObjectURL(file.rawFile) : null);
                     if (downloadUrl) {
                       const a = document.createElement('a');
                       a.href = downloadUrl;
                       a.download = file.name;
                       document.body.appendChild(a);
                       a.click();
                       document.body.removeChild(a);
                       if (!file.url) URL.revokeObjectURL(downloadUrl);
                     }
                  }}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Download File"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-zinc-50 dark:bg-[#0c0c0e]">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#0c0c0e]">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                  <span className="text-zinc-500 font-medium animate-pulse">Parsing file...</span>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-[#0c0c0e]">
                  <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                    <X className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Error Loading File</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
                </div>
              ) : isImage ? (
                <div className="w-full h-full flex items-center justify-center p-6 bg-zinc-100/50 dark:bg-[#08080a]">
                  <img 
                    src={file.url || URL.createObjectURL(file.rawFile)} 
                    alt={file.name} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              ) : isCSV ? (
                renderCSV()
              ) : (
                renderText()
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
