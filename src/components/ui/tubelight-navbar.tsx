import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  onClick?: () => void
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  activeTab?: string
}

export function NavBar({ items, className, activeTab: externalActiveTab }: NavBarProps) {
  const [localActiveTab, setLocalActiveTab] = useState(items[0].name)
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : localActiveTab
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 sm:bottom-auto left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-black/40 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                }
                setLocalActiveTab(item.name)
              }}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-gray-300 hover:text-white",
                isActive && "bg-white/10 text-[var(--theme-color)] drop-shadow-md",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  style={{ backgroundColor: 'color-mix(in srgb, var(--theme-color) 10%, transparent)' }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-[var(--theme-color)]">
                    <div className="absolute w-12 h-6 rounded-full blur-md -top-2 -left-2" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-color) 30%, transparent)' }} />
                    <div className="absolute w-8 h-6 rounded-full blur-md -top-1" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-color) 30%, transparent)' }} />
                    <div className="absolute w-4 h-4 rounded-full blur-sm top-0 left-2" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-color) 30%, transparent)' }} />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
