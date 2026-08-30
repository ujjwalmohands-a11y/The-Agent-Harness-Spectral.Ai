import React from 'react';
import { Bot, Shield, Zap, Terminal, ChevronRight, Sparkles } from 'lucide-react';
import Footer1 from "@/components/ui/footer-section-1";
import { RuixenGradientFooter } from './ui/ruixen-gradient-footer';
import HeroSection from './Hero/HeroSection';
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-sans selection:bg-white/10 flex flex-col">
      <HeroSection />

      {/* Features Section */}
      <section className="py-32 px-4 bg-[#050508] relative z-10">

        {/* Soft top transition glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-white/[0.02] rounded-[100%] blur-[80px] pointer-events-none -mt-[200px]" />

        {/* Stylized Grid Transition */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
          }}
        />

        <div className="max-w-[1100px] mx-auto text-center relative z-10">
          <span className="inline-block text-[0.75rem] font-mono text-cyan-400 border border-cyan-400/30 bg-cyan-400/5 py-1 px-4 mb-6 uppercase tracking-widest">
            &gt; autonomous_architecture_
          </span>
          <h2 className="text-[2rem] md:text-[2.5rem] font-mono tracking-tight mb-6 text-gray-200">
            <span className="text-gray-600">root@trueforge:~$</span> ./safety-and-speed.sh<span className="animate-crisp-blink">_</span>
          </h2>
          <p className="text-[1rem] text-gray-500 mb-16 max-w-2xl mx-auto font-mono">
            Everything you need to monitor, govern, and execute autonomous AI agents in real-time. Designed for production scale.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5 p-px">
            <FeatureCard
              icon={<Zap className="text-gray-500 group-hover:text-cyan-300 transition-colors" size={20} />}
              badgeText="Live"
              badgeActive={true}
              title="Real-time Traces"
              description="Watch the agent think and act in real-time. Gain complete visibility into tool execution streams and thought processes via Server-Sent Events."
            />
            <FeatureCard
              icon={<Shield className="text-gray-500 group-hover:text-cyan-300 transition-colors" size={20} />}
              badgeText="Security Gate"
              badgeActive={false}
              title="Human Approvals"
              description="Never lose control. The agent pauses execution and requests your explicit approval before taking sensitive or destructive write actions."
            />
            <FeatureCard
              icon={<Terminal className="text-gray-500 group-hover:text-cyan-300 transition-colors" size={20} />}
              badgeText="SDK Ready"
              badgeActive={true}
              title="TrueForge Powered"
              description="Natively connected to the TrueForge backend via frontend SDK. Swap LLM engines on the fly, leverage pre-built MCP toolkits, and launch instantly."
            />
            <FeatureCard
              icon={<Sparkles className="text-gray-500 group-hover:text-cyan-300 transition-colors" size={20} />}
              badgeText="Automated CI"
              badgeActive={false}
              title="Qodo Code Integrity"
              description="Ensure agent-generated code is production-ready. Automatically generate context-aware unit tests, enforce codebase rules, and automate pull request reviews."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <RuixenGradientFooter gradientHeight="40vh" className="bg-[#050508]">
        <Footer1 />
      </RuixenGradientFooter>
    </div>
  );
}

function FeatureCard({ icon, badgeText, badgeActive, title, description }) {
  return (
    <div className="relative bg-[#050508] p-8 text-left transition-colors duration-300 hover:bg-[#0a0a0c] flex flex-col group font-mono">
      <div className="flex justify-between items-start mb-8">
        <div>
          {icon}
        </div>
        {badgeText && (
          <span className={`text-[0.7rem] uppercase tracking-widest text-cyan-400`}>
            {badgeActive ? `[ ${badgeText} ]` : `< ${badgeText} >`}
          </span>
        )}
      </div>
      <h3 className="text-[1.1rem] text-gray-300 mb-3 group-hover:text-cyan-300 transition-colors">
        <span className="text-gray-600 mr-2">~/$</span>
        {title}
      </h3>
      <p className="text-[0.9rem] text-gray-500 leading-relaxed font-sans">{description}</p>
    </div>
  );
}
