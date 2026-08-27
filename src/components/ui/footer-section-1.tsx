"use client";
import React from "react";
import { SocialCloud } from "@/components/ui/footer-section-1-utils/social-cloud";
import { motion, Variants } from "motion/react";

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
          {["Solution", "About", "Blog", "Team"].map(
            (item) => (
              <motion.a
                key={item}
                href="#"
                className="relative px-2 py-1 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                  {item}
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
