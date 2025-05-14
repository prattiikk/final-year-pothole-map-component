"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MapPin, Github, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tighter">
                road<span className="text-primary">sense</span>
              </span>
            </Link>
            <p className="text-foreground/70 mb-6 max-w-md">
              Transforming everyday journeys into data that improves road infrastructure for everyone. Join our
              community of drivers making a difference.
            </p>
            <div className="flex space-x-4">
              {[Github, Twitter, Instagram].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ y: -3 }}
                  className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              {["Features", "How It Works", "Pricing", "FAQ"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-foreground/70 hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Contact", "Privacy", "Terms"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-foreground/70 hover:text-foreground transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-foreground/60 mb-4 md:mb-0">
            © {new Date().getFullYear()} RoadSense. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
