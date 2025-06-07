"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Smartphone, Server, Database, Map, Video } from "lucide-react"

export function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const steps = [
    {
      number: "01",
      title: "Mount & Start",
      description:
        "Mount your phone on the dashboard facing the road, ensure it's connected to the internet, and open our site. Tap the 'Report Potholes' button to begin.",
      icon: Smartphone,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      number: "02",
      title: "Capture Intelligently",
      description:
        "The system automatically adjusts frame capture rate based on your vehicle's speed, optimizing for accuracy and efficiency during data collection.",
      icon: Video,
      color: "bg-cyan-500/10 text-cyan-500",
    },
    {
      number: "03",
      title: "Detect with AI",
      description:
        "Captured frames are sent to our backend where a YOLOv9 model detects potholes and other anomalies with high precision in real-time.",
      icon: Server,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      number: "04",
      title: "Store & Analyze",
      description:
        "The results, including location, severity, and confidence scores, are stored in a centralized database for further analysis and transparency.",
      icon: Database,
      color: "bg-green-500/10 text-green-500",
    },
    {
      number: "05",
      title: "Visualize & Act",
      description:
        "The frontend map interface visualizes all detected anomalies, allowing users and authorities to identify and address road issues efficiently.",
      icon: Map,
      color: "bg-purple-500/10 text-purple-500",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-medium mb-3">The Process</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Turn your daily drive into valuable data. Our system detects road anomalies using your phone&apos;s camera and AI models, helping create safer roads.
          </p>
        </motion.div>

        <div ref={ref} className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 -translate-x-1/2 hidden md:block"></div>

          <div className="space-y-12 md:space-y-0 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`md:flex items-center ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  } gap-8 md:h-48`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className="flex items-center gap-2 mb-2 justify-start md:justify-end">
                    <step.icon className={`h-5 w-5 ${index % 2 === 1 ? "md:order-2" : ""}`} />
                    <h3 className="text-5xl font-bold text-primary/20">{step.number}</h3>
                  </div>
                  <h4 className="text-2xl font-semibold mt-2">{step.title}</h4>
                  <p className="text-muted-foreground mt-2">{step.description}</p>
                </div>

                <div className="hidden md:flex items-center justify-center relative">
                  <div className="h-12 w-12 rounded-full bg-primary/80 flex items-center justify-center z-10">
                    <span className="text-primary-foreground font-bold">{index + 1}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="h-full w-full rounded-xl overflow-hidden border border-border/50 shadow-sm">
                    <div className={`h-48 w-full ${step.color} p-6 flex items-center justify-center`}>
                      <step.icon className="h-20 w-20" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}