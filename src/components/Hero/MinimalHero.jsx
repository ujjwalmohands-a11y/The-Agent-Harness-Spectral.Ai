import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CurvedLoop from './CurvedLoop';
import './MinimalHero.css';

export default function MinimalHero() {
  const [isChatActive, setIsChatActive] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-focus the input when the chat box appears
  useEffect(() => {
    if (isChatActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatActive]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const query = inputRef.current?.value;
      if (query && query.trim()) {
        console.log("Routing to chat page with query:", query);
        navigate('/chat', { state: { initialPrompt: query } });
      }
    }
  };

  return (
    <main className="minimal-container">
      {!isChatActive ? (
        <div className="text-content fade-in">
          {/* 1. The Rotating Curved Text */}
          <div className="curved-wrapper">
            <CurvedLoop
              marqueeText="Thought into execution. ✦ Spectral Core v1.0 ✦ Fast ✦ "
              speed={1.5}
              curveAmount={-250}
              interactive={false}
              className="curved-text-style"
            />
          </div>

          {/* 2. Main Title */}
          <h1 className="main-title">Spectral AI</h1>

          {/* 3. Professional Subtext */}
          <p className="subtitle">
            <span className="brand-tag">Spectral AI • Guided by TrueForge</span>
            Beautifully designed, agent-focused, and packed with tools.
          </p>

          {/* 4. Single Call to Action */}
          <button
            className="btn-primary"
            onClick={() => setIsChatActive(true)}
          >
            Getting Started
          </button>
        </div>
      ) : (
        <div className="chat-content fade-in">
          {/* 5. The Minimal Chat Box Transition */}
          <div className="minimal-input-wrapper relative">
            <input
              ref={inputRef}
              type="text"
              className="minimal-input"
              placeholder="What do you want to build today?"
              onKeyDown={handleSearch}
            />
            <button className="btn-submit" onClick={handleSearch}>
              ↵
            </button>
          </div>
          <button className="btn-cancel" onClick={() => setIsChatActive(false)}>
            Cancel
          </button>
        </div>
      )}
    </main>
  );
}
