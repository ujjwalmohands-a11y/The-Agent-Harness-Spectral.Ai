import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GitBranch, ChevronDown, RotateCcw, Command, Palette } from 'lucide-react';
import { ColorArea, ColorPicker, ColorSlider, ColorSwatch, Label } from "@heroui/react";

// Import your React Bits components
import { Home, Users, Sparkles, MessageSquarePlus } from 'lucide-react';
import ColorBends from './ColorBends';
import DotField from './DotField';
import { CoverflowCarousel } from './CoverflowCarousel';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';

const PRESETS = {
  Nebula: {
    color: "#a855f7",
    colors: ["#a855f7", "#c026d3", "#4f46e5"],
    speed: 0.2,
    frequency: 1.0,
    noise: 0.15,
    bandWidth: 0.14,
    rotation: 90,
    fadeTop: 0.75,
    iterations: 1,
    intensity: 1.3,
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    cursorForce: 0.10,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
  },
  Aurora: {
    color: "#06B6D4",
    colors: ["#06b6d4", "#3b82f6", "#2dd4bf"],
    speed: 0.1,
    frequency: 1.1,
    noise: 0.02,
    bandWidth: 0.40,
    rotation: 45,
    fadeTop: 0.95,
    iterations: 2,
    intensity: 1.1,
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    cursorForce: 0.10,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
  },
  Ember: {
    color: "#f97316",
    colors: ["#f97316", "#ef4444", "#fcd34d"],
    speed: 0.4,
    frequency: 1.8,
    noise: 0.18,
    bandWidth: 0.22,
    rotation: 115,
    fadeTop: 0.70,
    iterations: 1,
    intensity: 1.4,
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    cursorForce: 0.10,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
  },
  Snow: {
    color: "#ffffff",
    colors: ["#ffffff", "#e2e8f0", "#cbd5e1"],
    speed: 0.1,
    frequency: 1.2,
    noise: 0.06,
    bandWidth: 0.40,
    rotation: 45,
    fadeTop: 0.95,
    iterations: 2,
    intensity: 1.1,
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    cursorForce: 0.10,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
  }
};

const parseHex = (hex) => {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16)
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0
  ];
};

const interpolateColor = (hex1, hex2, p) => {
  if (!hex1 || !hex2 || !hex1.startsWith('#') || !hex2.startsWith('#')) return hex2;
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const r = Math.round(r1 + (r2 - r1) * p);
  const g = Math.round(g1 + (g2 - g1) * p);
  const b = Math.round(b1 + (b2 - b1) * p);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).padStart(6, '0')}`;
};

function useAnimatedConfig(targetConfig, duration = 1000) {
  const [config, setConfig] = useState(targetConfig);
  const targetStr = JSON.stringify(targetConfig);

  useEffect(() => {
    let startTimestamp = null;
    const initialConfig = { ...config };

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const newConfig = { ...targetConfig };
      for (const key in targetConfig) {
        if (typeof targetConfig[key] === 'number') {
          newConfig[key] = (initialConfig[key] || 0) + (targetConfig[key] - (initialConfig[key] || 0)) * ease;
        } else if (Array.isArray(targetConfig[key])) {
          newConfig[key] = targetConfig[key].map((c, i) => interpolateColor(initialConfig[key]?.[i] || c, c, ease));
        } else if (typeof targetConfig[key] === 'string' && targetConfig[key].startsWith('#')) {
          newConfig[key] = interpolateColor(initialConfig[key] || targetConfig[key], targetConfig[key], ease);
        }
      }

      setConfig(newConfig);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetStr, duration]);

  return config;
}

// Custom hook to smoothly animate a number over time (kept for the terminal values)
function useAnimatedNumber(targetValue, duration = 600) {
  const [value, setValue] = useState(targetValue);

  useEffect(() => {
    if (targetValue === value) return;

    let startTimestamp = null;
    const initialValue = value;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(initialValue + (targetValue - initialValue) * ease);

      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return value;
}

let audioCtx = null;
const playTickSound = () => {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.02);
  } catch (e) { }
};

const NumberProp = ({ label, value, onChange, step = 0.1, min = 0, max = Infinity }) => {
  const animatedValue = useAnimatedNumber(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef(null);
  const lastEmittedValueRef = React.useRef(value);
  const listenersRef = React.useRef({ move: null, up: null });

  React.useEffect(() => {
    return () => {
      if (listenersRef.current.move) window.removeEventListener('pointermove', listenersRef.current.move);
      if (listenersRef.current.up) window.removeEventListener('pointerup', listenersRef.current.up);
    };
  }, []);

  const displayValue = isFocused ? value : animatedValue;
  const decimals = step.toString().includes('.') ? step.toString().split('.')[1].length : 0;

  const handlePointerDown = (e) => {
    const startX = e.clientX;
    const startVal = value;
    let isDragging = false;
    lastEmittedValueRef.current = value;

    const handlePointerMove = (ev) => {
      const deltaX = ev.clientX - startX;

      if (Math.abs(deltaX) > 2) {
        isDragging = true;
        // Increase/decrease every 4 pixels dragged horizontally
        const ticks = Math.round(deltaX / 4);
        let newVal = startVal + ticks * step;

        newVal = Math.max(min, Math.min(max, newVal));
        const snapped = Number(newVal.toFixed(decimals));

        if (snapped !== lastEmittedValueRef.current) {
          playTickSound();
          lastEmittedValueRef.current = snapped;
          onChange(snapped);
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      listenersRef.current = { move: null, up: null };
      if (!isDragging && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    listenersRef.current = { move: handlePointerMove, up: handlePointerUp };
  };

  return (
    <div className="flex items-center">
      <span className="text-white">{label}=</span>
      <span className="text-white ml-1">{"{"}</span>
      <div
        className="inline-flex items-center bg-black/30 hover:bg-black/50 transition-colors rounded px-1.5 py-0.5 mx-0.5 text-[10px] sm:text-xs text-cyan-300 border border-white/5 shadow-inner leading-none cursor-ew-resize select-none"
        onPointerDown={handlePointerDown}
      >
        <input
          ref={inputRef}
          type="number"
          step={step}
          min={min}
          max={max}
          value={Number(displayValue).toFixed(decimals)}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
              onChange(Math.max(min, Math.min(max, v)));
            } else {
              onChange(0);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="bg-transparent outline-none w-[40px] sm:w-[45px] text-center text-cyan-300 font-mono transition-all duration-300 m-0 p-0 text-[10px] sm:text-xs"
        />
      </div>
      <span className="text-white">{"}"}</span>
    </div>
  );
};

const hexToRgba = (hex, alpha) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const TEAM_SLIDES = [
  {
    src: "/team-member-1.png",
    alt: "Manish kumar Sahu",
    title: "Manish kumar Sahu",
    subtitle: "Agent & Harness Lead",
  },
  {
    src: "/team-member-2.png",
    alt: "Soumyaranjan Mishra",
    title: "Soumyaranjan Mishra",
    subtitle: "Tools & MCP Integrator",
  },
  {
    src: "/team-member-3.png",
    alt: "Ujjwal Mohan",
    title: "Ujjwal Mohan",
    subtitle: "The Frontend & Control Lead",
  },
  {
    src: "/team-member-4.png",
    alt: "Aryan Gupta",
    title: "Aryan Gupta",
    subtitle: "Code Quality & Demo Lead",
  }
];


export default function HeroSection() {
  const [activePreset, setActivePreset] = useState('Aurora');
  const [config, setConfig] = useState(PRESETS['Aurora']);
  const [activeTab, setActiveTab] = useState('ColorBends');
  const navigate = useNavigate();
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Team', url: '#', icon: Users, onClick: () => { setIsTeamOpen(!isTeamOpen); setIsTerminalOpen(false); } },
    { name: 'Whisper', url: '#', icon: MessageSquarePlus, onClick: () => console.log("Open feedback modal") },
    { name: 'Chat', url: '/chat', icon: Sparkles }
  ];

  const isCustomColor = !PRESETS[activePreset] || PRESETS[activePreset].color !== config.color;
  const auroraColors = isCustomColor ? [config.color, config.color, "#ffffff"] : config.colors;

  const targetConfigForAnimation = { ...config, colors: auroraColors };
  const smoothConfig = useAnimatedConfig(targetConfigForAnimation, 1000);

  const currentOpacity = smoothConfig.dotOpacity !== undefined ? smoothConfig.dotOpacity : 0.4;
  const dotGlow = hexToRgba(smoothConfig.color, currentOpacity);
  const dotGlowCore = hexToRgba(smoothConfig.color, currentOpacity * 0.5);

  return (
    <div
      className="relative min-h-screen text-white overflow-hidden font-sans transition-colors duration-1000"
      style={{
        background: 'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--theme-color) 20%, #111118) 0%, #050508 100%)',
        '--theme-color': smoothConfig.color,
        '--theme-c1': smoothConfig.colors[0],
        '--theme-c2': smoothConfig.colors[1] || smoothConfig.colors[0],
        '--theme-glow': hexToRgba(smoothConfig.color, 0.4),
        '--theme-glow-strong': hexToRgba(smoothConfig.color, 0.8),
      }}
    >

      {/* Background Layers */}
      <div className="absolute -inset-[5%] z-0 opacity-80 saturate-150 pointer-events-none">
        <ColorBends
          colors={smoothConfig.colors}
          rotation={smoothConfig.rotation}
          speed={smoothConfig.speed}
          scale={1.2}
          frequency={smoothConfig.frequency}
          intensity={smoothConfig.intensity}
          noise={smoothConfig.noise}
          warpStrength={1}
          bandWidth={smoothConfig.bandWidth * 15}
          transparent={true}
        />
      </div>

      <div className="absolute inset-0 z-0 opacity-100">
        <DotField
          dotRadius={smoothConfig.dotRadius || 1.8}
          dotSpacing={smoothConfig.dotSpacing || 16}
          cursorRadius={400}
          cursorForce={0.15}
          bulgeOnly={true}
          bulgeStrength={smoothConfig.bulgeStrength || 80}
          glowRadius={0}
          sparkle={true}
          gradientFrom={dotGlow}
          gradientTo={dotGlow}
          glowColor={dotGlowCore}
        />
      </div>

      <div
        className="absolute -inset-[10%] z-10 pointer-events-none mix-blend-overlay opacity-25 animate-noise"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top & Bottom Fade Overlays */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050508]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050508] to-transparent z-10 pointer-events-none" />

      <NavBar items={navItems} />

      {/* Floating Theme Button */}
      <button
        onClick={() => { setIsTerminalOpen(!isTerminalOpen); setIsTeamOpen(false); }}
        className="fixed right-4 bottom-24 sm:right-6 sm:bottom-6 z-50 flex items-center gap-2 px-3 py-2 sm:px-3 sm:py-2.5 rounded-full bg-black/40 border border-white/10 hover:bg-black/70 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_var(--theme-glow)] text-white font-medium text-[10px] sm:text-xs group"
      >
        <Palette className="w-4 h-4 text-[var(--theme-color)] group-hover:scale-110 transition-transform" />
        Change Theme
      </button>

      {/* Foreground */}
      <div className="relative z-20 pointer-events-none">
        {/* Main Content */}
        <main className="w-full max-w-5xl mx-auto px-6 flex justify-center items-center relative z-20 min-h-screen">

          {/* Code Editor Window */}
          <div
            className={`relative w-full group transition-all duration-700 ease-out ${isTerminalOpen
              ? 'opacity-100 translate-y-0 scale-100 blur-none pointer-events-auto'
              : 'opacity-0 translate-y-24 scale-95 blur-md pointer-events-none'
              }`}
          >
            {/* Ambient Glow behind the terminal */}
            <div className="absolute -inset-1 bg-[var(--theme-color)] rounded-[20px] blur-[80px] opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

            <div className="aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] max-h-[60vh] rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col font-mono text-[10px] sm:text-[11px] lg:text-[12px] text-gray-300 overflow-hidden relative z-20 transition-all duration-500 hover:bg-black/50">

              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-white/[0.01]">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/20 hover:bg-red-400 transition-colors" />
                  <div className="w-2 h-2 rounded-full bg-white/20 hover:bg-amber-400 transition-colors" />
                  <div className="w-2 h-2 rounded-full bg-white/20 hover:bg-emerald-400 transition-colors" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setConfig(PRESETS[activePreset])} className="text-gray-500 hover:text-white transition-colors z-20 relative" title="Reset to Preset">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActiveTab(activeTab === 'ColorBends' ? 'DotField' : 'ColorBends')} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs text-gray-300 relative z-20">
                    {activeTab} <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Code Content */}
              {activeTab === 'ColorBends' ? (
                <div className="px-4 sm:px-6 py-2 sm:py-3 leading-[1.5] overflow-x-auto flex-1 flex flex-col justify-center">
                  <div>
                    <span className="text-white font-semibold">import</span> {'{ '}
                    <span className="text-purple-400">ColorBends</span>
                    {' } '} <span className="text-white font-semibold">from</span> <span className="text-gray-300">{'\'@components/ColorBends\''}</span>;
                  </div>

                  <div className="mt-4">
                    <span className="text-white font-semibold">function</span> <span className="text-white">App</span>() {'{'}
                  </div>
                  <div className="pl-4">
                    <span className="text-white font-semibold">return</span> (
                  </div>
                  <div className="pl-8 text-purple-400">
                    {'<ColorBends'}
                  </div>

                  <div className="pl-10 space-y-1 mt-1 sm:mt-1.5">
                    <div className="flex items-center">
                      <span className="text-white">color=</span>
                      <div className="flex items-center gap-1.5 ml-1 px-1.5 py-0.5 rounded bg-black/30 border border-white/5 shadow-inner relative overflow-visible hover:bg-black/50 transition-colors">
                        <ColorPicker value={config.color} onChange={v => setConfig({ ...config, color: v.toString('hex') })}>
                          <ColorPicker.Trigger className="flex items-center gap-1.5 cursor-pointer outline-none group w-full">
                            <ColorSwatch className="w-3 h-3 rounded-sm shadow-inner border border-white/20" color={config.color} />
                            <span className="text-purple-300 font-mono group-hover:text-purple-200 transition-colors">"{config.color}"</span>
                          </ColorPicker.Trigger>
                          <ColorPicker.Popover className="bg-black/90 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-50">
                            <ColorArea
                              aria-label="Color area"
                              className="max-w-full"
                              colorSpace="hsb"
                              xChannel="saturation"
                              yChannel="brightness"
                            >
                              <ColorArea.Thumb className="w-4 h-4 border-2 border-white rounded-full shadow" />
                            </ColorArea>
                            <ColorSlider channel="hue" className="gap-1 px-1 mt-3" colorSpace="hsb">
                              <Label className="text-xs text-gray-400">Hue</Label>
                              <ColorSlider.Track className="h-2 rounded-full mt-1">
                                <ColorSlider.Thumb className="w-4 h-4 border-2 border-white rounded-full shadow" />
                              </ColorSlider.Track>
                            </ColorSlider>
                          </ColorPicker.Popover>
                        </ColorPicker>
                      </div>
                    </div>

                    <NumberProp label="speed" value={config.speed} onChange={v => setConfig({ ...config, speed: v })} step={0.01} max={5} />
                    <NumberProp label="frequency" value={config.frequency} onChange={v => setConfig({ ...config, frequency: v })} step={0.1} max={10} />
                    <NumberProp label="noise" value={config.noise} onChange={v => setConfig({ ...config, noise: v })} step={0.01} max={2} />
                    <NumberProp label="bandWidth" value={config.bandWidth} onChange={v => setConfig({ ...config, bandWidth: v })} step={0.01} max={2} />
                    <NumberProp label="rotation" min={-360} max={360} value={config.rotation} onChange={v => setConfig({ ...config, rotation: v })} step={1} />
                    <NumberProp label="fadeTop" value={config.fadeTop || 0.75} onChange={v => setConfig({ ...config, fadeTop: v })} step={0.01} max={1} />
                    <NumberProp label="iterations" min={1} max={10} value={config.iterations} onChange={v => setConfig({ ...config, iterations: v })} step={1} />
                    <NumberProp label="intensity" value={config.intensity} onChange={v => setConfig({ ...config, intensity: v })} step={0.1} max={5} />
                  </div>

                  <div className="pl-8 mt-2 text-purple-400">{'/>'}</div>
                  <div className="pl-4">)</div>
                  <div>{'}'}</div>
                </div>
              ) : (
                <div className="px-4 sm:px-6 py-2 sm:py-3 leading-[1.5] overflow-x-auto flex-1 flex flex-col justify-center">
                  <div>
                    <span className="text-white font-semibold">import</span> {'{ '}
                    <span className="text-purple-400">DotField</span>
                    {' } '} <span className="text-white font-semibold">from</span> <span className="text-gray-300">{'\'@components/DotField\''}</span>;
                  </div>

                  <div className="mt-4">
                    <span className="text-white font-semibold">function</span> <span className="text-white">App</span>() {'{'}
                  </div>
                  <div className="pl-4">
                    <span className="text-white font-semibold">return</span> (
                  </div>
                  <div className="pl-8 text-purple-400">
                    {'<DotField'}
                  </div>

                  <div className="pl-10 space-y-1 mt-1 sm:mt-1.5">
                    <NumberProp label="dotRadius" min={0.1} max={10} value={config.dotRadius || 1.8} onChange={v => setConfig({ ...config, dotRadius: v })} step={0.1} />
                    <NumberProp label="dotSpacing" min={1} max={50} value={config.dotSpacing || 16} onChange={v => setConfig({ ...config, dotSpacing: v })} step={1} />
                    <NumberProp label="dotOpacity" max={1} value={config.dotOpacity !== undefined ? config.dotOpacity : 0.4} onChange={v => setConfig({ ...config, dotOpacity: v })} step={0.05} />
                    <NumberProp label="bulgeStrength" min={-200} max={200} value={config.bulgeStrength || 80} onChange={v => setConfig({ ...config, bulgeStrength: v })} step={1} />
                  </div>

                  <div className="pl-8 mt-2 text-purple-400">{'/>'}</div>
                  <div className="pl-4">)</div>
                  <div>{'}'}</div>
                </div>
              )}

              {/* Footer Tabs */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 mt-auto border-t border-white/[0.05] bg-white/[0.01]">
                <div className="flex gap-1 text-[10px] sm:text-xs font-medium overflow-x-auto custom-scrollbar pb-1 sm:pb-0 max-w-[70%] sm:max-w-none">
                  {Object.keys(PRESETS).map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        setActivePreset(preset);
                        setConfig(PRESETS[preset]);
                      }}
                      className={`px-3 py-1.5 rounded-md transition-colors ${activePreset === preset
                        ? 'bg-white/10 text-[var(--theme-color)] shadow-sm'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 font-mono hidden sm:block whitespace-nowrap ml-2">
                  ↔ Every value is editable
                </div>
              </div>

            </div>
          </div>

          {/* Team Window */}
          <div
            className={`absolute w-full max-w-3xl group transition-all duration-700 ease-out z-30 ${isTeamOpen
              ? 'opacity-100 translate-y-0 scale-100 blur-none pointer-events-auto'
              : 'opacity-0 translate-y-24 scale-95 blur-md pointer-events-none'
              }`}
          >
            <div className="absolute -inset-1 bg-[var(--theme-color)] rounded-[20px] blur-[80px] opacity-20 transition duration-1000" />
            <div className="rounded-2xl bg-[#0c0c12]/80 backdrop-blur-2xl border border-white/5 shadow-2xl flex flex-col overflow-hidden relative z-20 transition-all duration-500">
              {/* Window Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-white/[0.01]">
                <div className="flex gap-2 cursor-pointer" onClick={() => setIsTeamOpen(false)}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 hover:bg-red-500 transition-colors" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20 hover:bg-amber-400 transition-colors" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20 hover:bg-emerald-400 transition-colors" />
                </div>
                <div className="text-white text-sm font-semibold tracking-wide">
                  Our Team
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
              </div>
              {/* Content */}
              <div className="w-full h-full flex items-center justify-center min-h-[450px]">
                <CoverflowCarousel
                  slides={TEAM_SLIDES}
                  rotate={44}
                  depth={0.6}
                  perspective={3}
                  falloff={0.56}
                  fade={0.1}
                  cardWidth="clamp(120px, 20vw, 220px)"
                  gap={0.05}
                  loop={true}
                  showCaption={true}
                  showPagination={true}
                  showNavigation={true}
                  className="w-full h-full flex flex-col justify-center min-h-[450px]"
                />
              </div>
            </div>
          </div>

          {/* AI Chat Box */}
          <div
            className={`absolute bottom-6 sm:bottom-12 w-full max-w-2xl px-4 sm:px-6 transition-all duration-700 ease-out z-10 ${
              (!isTerminalOpen && !isTeamOpen)
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-24 scale-95 pointer-events-none'
            }`}
          >
            <div className="relative group max-w-xl mx-auto">
               <div className="absolute -inset-2 bg-[var(--theme-color)] rounded-[30px] blur-xl opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none" />
               <PromptInputBox 
                 onSend={(message, files) => {
                   navigate('/chat', { state: { initialPrompt: message } });
                 }} 
                 placeholder="How can I help you build today?"
                 className="relative z-10 shadow-2xl border-white/10 bg-black/60 backdrop-blur-2xl text-[11px] sm:text-[13px] py-3 sm:py-4"
               />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
