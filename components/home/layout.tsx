"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X, MapPin, BarChart, Home, Camera } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", path: "/home", icon: Home },
    { name: "Map", path: "/map", icon: MapPin },
    { name: "Dashboard", path: "/dashboard", icon: BarChart },
  ]

  const isActive = (path: string) => {
    return pathname === path || (pathname.startsWith(path) && path !== "/home")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/home" className="text-xl font-bold tracking-tighter flex items-center">
                <MapPin className="h-5 w-5 mr-1 text-primary" />
                road<span className="text-primary">sense</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative font-medium flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <Link
                href="https://report.roadsense.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 font-medium hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span>Report Pothole</span>
              </Link>

              <ThemeToggle />
            </div>

            <div className="md:hidden flex items-center">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(true)}
                className="ml-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center px-6 py-4 border-b border-border/50">
                <Link href="/home" className="text-xl font-bold tracking-tighter flex items-center">
                  <MapPin className="h-5 w-5 mr-1 text-primary" />
                  road<span className="text-primary">sense</span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md hover:bg-muted/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-col p-6 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-md ${
                      isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}

                <div className="pt-4 mt-4 border-t border-border/50">
                  <Link
                    href="https://report.roadsense.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-md bg-primary text-primary-foreground"
                  >
                    <Camera className="h-5 w-5" />
                    Report Pothole
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-16">{children}</main>
    </div>
  )
}
