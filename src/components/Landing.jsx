import React from 'react';
import { Bot, Shield, Zap, Terminal, ChevronRight } from 'lucide-react';
import Footer1 from "@/components/ui/footer-section-1";
import { RuixenGradientFooter } from './ui/ruixen-gradient-footer';
import HeroSection from './Hero/HeroSection';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050508] text-gray-300 font-sans selection:bg-purple-500/30 flex flex-col">

      <HeroSection />

      {/* Features Section */}
      <section className="py-24 px-4 bg-[#050508] relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built for Safety & Speed</h2>
            <p className="text-gray-400">Everything you need to control autonomous AI agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="text-white" size={24} />}
              title="Real-time Traces"
              description="Watch the agent think and act in real-time. Full visibility into tool execution and thought processes via Server-Sent Events."
            />
            <FeatureCard
              icon={<Shield className="text-white" size={24} />}
              title="Human Approvals"
              description="Never lose control. The agent pauses execution and requests your explicit approval before taking sensitive or destructive actions."
            />
            <FeatureCard
              icon={<Terminal className="text-white" size={24} />}
              title="TrueForge Powered"
              description="Seamlessly integrated with TrueForge backend. Easily swap out models, add custom MCP tools, and deploy instantly."
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

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group p-8 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 shadow-sm transition-all hover:border-white/10 hover:-translate-y-1">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
