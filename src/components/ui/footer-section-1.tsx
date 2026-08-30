"use client";
import React, { useState } from "react";
import { SocialCloud } from "@/components/ui/footer-section-1-utils/social-cloud";
import { motion, Variants, AnimatePresence } from "motion/react";
import { CoverflowCarousel } from "@/components/Hero/CoverflowCarousel";

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

const SolaceUILogo = ({ className }: { className?: string }) => {
  return (
    <img
      src="/sudharshan prabhu.svg"
      alt="Sudarshan Chakra"
      className={className}
    />
  );
};

export default function Footer1() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const dividerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.5 } }, // Appears after a delay
  };

  return (
    <footer className="w-full py-12 text-gray-200 overflow-hidden relative z-10 border-t border-white/5">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
        variants={containerVariants}
        className="container mx-auto px-4 flex flex-col items-center gap-10 mb-12"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <SolaceUILogo className="h-14 w-auto" />
        </motion.div>

        {/* Navigation Links */}
        <motion.nav
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-base font-medium relative z-10"
        >
          {[
            { name: "Solution", href: "#" },
            { name: "About", href: "#" },
            { name: "Blog", href: "https://example.com/blog" },
            { name: "Team", href: "#" }
          ].map(
            (item) => (
              <motion.a
                key={item.name}
                href={item.href}
                target={item.name === "Blog" ? "_blank" : undefined}
                rel={item.name === "Blog" ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (item.name === "Solution" || item.name === "About" || item.name === "Team") {
                    e.preventDefault();
                    setActiveSection(activeSection === item.name ? null : item.name);
                  }
                }}
                className="relative px-2 py-1 group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                  {item.name}
                </span>
                <motion.span
                  className="absolute inset-0 bg-white/10 rounded-md -z-0 origin-center"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </motion.a>
            ),
          )}
        </motion.nav>

        <AnimatePresence mode="wait">
          {activeSection === "Solution" && (
            <motion.div
              key="solution"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl mx-auto overflow-hidden"
            >
              <div className="p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-fuchsia-500/5 rounded-3xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <p className="text-gray-300/90 text-base md:text-lg leading-relaxed relative z-10 font-light text-center">
                  <strong className="text-white font-medium">Spectral AI</strong> introduces <strong className="text-white font-medium">Oliver</strong>, a secure AI assistant built on the TrueForge SDK that strictly prevents irreversible actions without explicit human approval. By seamlessly integrating Gmail, Google Calendar, Google Sheets, and Notion, Oliver enables users to rapidly delegate administrative tasks and automate daily workflows with absolute confidence. Powered by DotStudio via OpenRouter for intelligent chat and the Groq API for highly responsive voice interactions, Oliver handles complex requests safely and efficiently. To guarantee a flawless codebase, we leveraged the Qodo Safe Code Review extension to proactively resolve bugs and maintain the highest standard of project cleanliness.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === "About" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl mx-auto overflow-hidden"
            >
              <div className="p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 rounded-3xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 text-center">About the Team</h3>
                <p className="text-gray-300/90 text-base md:text-lg leading-relaxed relative z-10 font-light text-center">
                  We are a driven team of four second-year engineering students pursuing our B.Tech in CEC at <strong className="text-white font-medium">Siksha 'O' Anusandhan</strong> in Bhubaneswar, Odisha. With a shared passion for artificial intelligence, software development, and workflow automation, we teamed up to build <strong className="text-white font-medium">Spectral AI</strong>. This project represents our push to solve real-world productivity challenges by bridging the gap between our academic foundation and cutting-edge developer tools like <strong className="text-white font-medium">TrueForge</strong> and <strong className="text-white font-medium">Qodo</strong>.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === "Team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-5xl mx-auto overflow-hidden"
            >
              <div className="p-8 md:p-10 rounded-3xl bg-[#0c0c12]/50 border border-white/10 backdrop-blur-xl shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 rounded-3xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 text-center relative z-10">Our Team</h3>
                <div className="w-full h-full flex items-center justify-center min-h-[450px] relative z-10">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Media Icons */}
        <motion.div variants={itemVariants}>
          <SocialCloud className="text-gray-200" />
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="w-full h-12 border-y border-gray-400 opacity-20 bg-[repeating-linear-gradient(315deg,currentColor_0,currentColor_1px,transparent_0,transparent_50%)]"
        style={{ backgroundSize: "10px 10px" }}
        initial={{ backgroundPositionX: "0px" }}
        animate={{ backgroundPositionX: "-100px" }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 5,
        }}
      />

      {/* Copyright */}
      <motion.div
        className="container mx-auto px-4 mt-8 text-center text-sm text-gray-500"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={itemVariants} // Re-trigger for copyright or just use simple fade
      >
        <p>&copy; {new Date().getFullYear()} Team Sudarshan, All rights reserved</p>
      </motion.div>
    </footer>
  );
}
