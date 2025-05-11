"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderProps {
  onViewMapClick?: () => void
}

export function Header({ onViewMapClick }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 transition-all duration-300 ${
          scrolled ? "bg-background/80 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            road<span className="text-primary">sense</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <NavLinks />
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium"
                onClick={onViewMapClick}
              >
                View Map
              </motion.button>
            </div>
          </div>

          <div className="flex md:hidden items-center space-x-4">
            <ThemeToggle />
            <button onClick={() => setIsOpen(true)} className="p-1">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center px-6 py-6">
                <Link href="/" className="text-xl font-bold tracking-tighter">
                  road<span className="text-primary">sense</span>
                </Link>
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center flex-grow space-y-8 text-2xl">
                <Link href="#features" onClick={() => setIsOpen(false)}>
                  Features
                </Link>
                <Link href="#data" onClick={() => setIsOpen(false)}>
                  Data
                </Link>
                <Link href="#community" onClick={() => setIsOpen(false)}>
                  Community
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium mt-4"
                  onClick={() => {
                    setIsOpen(false)
                    if (onViewMapClick) {
                      onViewMapClick();
                    }
                  }}
                >
                  View Map
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLinks() {
  return (
    <>
      {["Features", "Data", "Community"].map((item) => (
        <Link
          key={item}
          href={`#${item.toLowerCase()}`}
          className="relative font-medium text-foreground/80 hover:text-foreground transition-colors group"
        >
          {item}
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
        </Link>
      ))}
    </>
  )
}
