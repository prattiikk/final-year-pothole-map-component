"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Camera, Smartphone, Map, AlertTriangle, BarChart, Clock } from "lucide-react"

export function FeatureShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const features = [
    {
      icon: Camera,
      title: "Dashcam Integration",
      description: "Process footage automatically while you drive",
    },
    {
      icon: Smartphone,
      title: "Mobile Capture",
      description: "Report issues on the go with your smartphone",
    },
    {
      icon: Map,
      title: "Interactive Maps",
      description: "Explore detailed road condition visualizations",
    },
    {
      icon: AlertTriangle,
      title: "Real-time Alerts",
      description: "Get notified about hazards on your route",
    },
    {
      icon: BarChart,
      title: "Data Analytics",
      description: "Track improvements and deterioration over time",
    },
    {
      icon: Clock,
      title: "Historical Tracking",
      description: "Monitor repair progress and recurring issues",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section id="features" className="py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-medium mb-3">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Intelligent road monitoring</h2>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative bg-background border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-colors duration-300"
            >
              <div className="absolute -z-10 inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-foreground/70">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
