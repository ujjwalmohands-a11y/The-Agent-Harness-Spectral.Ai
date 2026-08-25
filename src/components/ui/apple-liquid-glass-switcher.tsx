"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Theme = "light" | "dark";

interface ThemeSwitcherProps {
  defaultValue?: Theme;
  value?: Theme;
  onValueChange?: (theme: Theme) => void;
}

const themeOptions: { value: Theme; cOption: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    cOption: "1",
    icon: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36">
        <path fill="currentColor" fillRule="evenodd" d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" clipRule="evenodd" />
        <path fill="currentColor" d="M17 6.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 7.742a1 1 0 1 1 1.618 1.176L24.1 11.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 13.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM29.722 20.795a1 1 0 0 1-.619 1.902l-2.853-.927a1 1 0 1 1 .618-1.902l2.854.927ZM25.862 27.159a1 1 0 0 1-1.618 1.175l-1.763-2.427a1 1 0 1 1 1.618-1.175l1.763 2.427ZM19 30.038a1 1 0 0 1-2 0v-3a1 1 0 1 1 2 0v3ZM11.755 28.334a1 1 0 0 1-1.618-1.175l1.764-2.427a1 1 0 1 1 1.618 1.175l1.764 2.427ZM6.896 22.697a1 1 0 1 1-.618-1.902l2.853-.927a1 1 0 1 1 .618 1.902l-2.853.927ZM6.278 15.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 8.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z" />
      </svg>
    ),
  },
  {
    value: "dark",
    cOption: "2",
    icon: (
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36">
        <path fill="currentColor" d="M12.5 8.473a10.968 10.968 0 0 1 8.785-.97 7.435 7.435 0 0 0-3.737 4.672l-.09.373A7.454 7.454 0 0 0 28.732 20.4a10.97 10.97 0 0 1-5.232 7.125l-.497.27c-5.014 2.566-11.175.916-14.234-3.813l-.295-.483C5.53 18.403 7.13 11.93 12.017 8.77l.483-.297Zm4.234.616a8.946 8.946 0 0 0-2.805.883l-.429.234A9 9 0 0 0 10.206 22.5l.241.395A9 9 0 0 0 22.5 25.794l.416-.255a8.94 8.94 0 0 0 2.167-1.99 9.433 9.433 0 0 1-2.782-.313c-5.043-1.352-8.036-6.535-6.686-11.578l.147-.491c.242-.745.573-1.44.972-2.078Z" />
      </svg>
    ),
  },
];

export function ThemeSwitcher({
  defaultValue = "dark",
  value,
  onValueChange,
}: ThemeSwitcherProps) {
  // Try to read current theme from document element to match actual state, default to 'dark' for this app
  const [internalValue, setInternalValue] = useState<Theme>(defaultValue);
  const activeValue = value ?? internalValue;

  useEffect(() => {
    // Sync with HTML class
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (activeValue === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  }, [activeValue]);

  const handleChange = (newValue: Theme) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <div className="relative flex items-center p-1 bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full border border-black/5 dark:border-white/10 shadow-inner">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={`relative z-10 flex items-center justify-center w-10 h-8 rounded-full transition-colors duration-300 ${
            activeValue === option.value ? "text-black dark:text-white" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
          }`}
          aria-label={`Switch to ${option.value} theme`}
        >
          {activeValue === option.value && (
            <motion.div
              layoutId="theme-bubble"
              className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-black/5 dark:border-white/10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className="relative z-20">{option.icon}</span>
        </button>
      ))}
    </div>
  );
}
