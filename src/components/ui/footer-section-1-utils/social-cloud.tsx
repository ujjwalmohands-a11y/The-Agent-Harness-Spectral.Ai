import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const teamMembers = [
  { name: "Manish", avatar: "/team-member-1.png", github: "https://github.com/Dxt-zester", linkedin: "https://www.linkedin.com/in/manish-kumar-sahu-024972370?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
  { name: "Soum", avatar: "/team-member-2.png", github: "https://github.com/SomMishra-alt", linkedin: "https://in.linkedin.com/in/soumyaranjan-misra-6983793a6" },
  { name: "Ujjwal Mohan", avatar: "/team-member-3.png", github: "https://github.com/ujjwalmohands-a11y", linkedin: "https://www.linkedin.com/in/ujjwalmohands/" },
  { name: "Aryan", avatar: "/team-member-4.png", github: "https://github.com/aryangupta0003245-dotcom", linkedin: "https://www.linkedin.com/in/aryan-gupta-059120381/" },
];

// Helper to calculate coordinates for a downward semi-circle
// We'll map angle from 15deg to 165deg (where 90deg is straight down)
const getBubbleVariants = (index: number, total: number, radius = 60) => {
  const startAngle = 15;
  const endAngle = 165;
  const angleDeg = startAngle + (index * (endAngle - startAngle)) / Math.max(1, total - 1);
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = Math.cos(angleRad) * radius;
  const y = Math.sin(angleRad) * radius;

  return {
    hidden: { opacity: 0, x: 0, y: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      x,
      y,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 200, damping: 15, delay: index * 0.05 }
    },
    exit: {
      opacity: 0,
      x: 0,
      y: 0,
      scale: 0.5,
      transition: { duration: 0.2 }
    }
  };
};

export function SocialCloud({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState<"github" | "linkedin" | null>(null);

  const toggleExpand = (type: "github" | "linkedin") => {
    if (expanded === type) {
      setExpanded(null);
    } else {
      setExpanded(type);
    }
  };

  return (
    <div className={`flex gap-8 relative items-center justify-center min-h-[40px] ${className}`}>

      {/* Invisible overlay for clicking outside to close */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 cursor-pointer"
            onClick={() => setExpanded(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {expanded !== "linkedin" && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 flex justify-center"
          >
            <button
              onClick={() => toggleExpand("github")}
              className={`hover:text-purple-400 transition-colors z-20 relative flex items-center justify-center p-2 rounded-full ${expanded === 'github' ? 'text-purple-400' : ''}`}
            >
              <GithubIcon className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {expanded === "github" && teamMembers.map((member, idx) => (
                <motion.a
                  key={idx}
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={getBubbleVariants(idx, teamMembers.length, 65)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-purple-400 shadow-lg z-10 bg-[#111] group"
                  style={{ top: "50%", left: "50%", marginTop: "-20px", marginLeft: "-20px" }}
                >
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {expanded !== "github" && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 flex justify-center"
          >
            <button
              onClick={() => toggleExpand("linkedin")}
              className={`hover:text-blue-400 transition-colors z-20 relative flex items-center justify-center p-2 rounded-full ${expanded === 'linkedin' ? 'text-blue-400' : ''}`}
            >
              <LinkedinIcon className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {expanded === "linkedin" && teamMembers.map((member, idx) => (
                <motion.a
                  key={idx}
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={getBubbleVariants(idx, teamMembers.length, 65)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-blue-400 shadow-lg z-10 bg-[#111] group"
                  style={{ top: "50%", left: "50%", marginTop: "-20px", marginLeft: "-20px" }}
                >
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

