"use client"

import { motion } from "framer-motion"
import { Camera, Map, AlertTriangle, Smartphone, BarChart, Clock } from "lucide-react"
import { useInView } from "react-intersection-observer"

export function Features() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  }

  const features = [
    {
      icon: Camera,
      title: "Dashcam Integration",
      description: "Automatically process footage from your dashcam to identify road issues while you drive.",
    },
    {
      icon: Smartphone,
      title: "Mobile Capture",
      description: "Use your smartphone to record and report road anomalies with our easy-to-use app.",
    },
    {
      icon: AlertTriangle,
      title: "Real-time Alerts",
      description: "Receive instant notifications about hazards on your route before you encounter them.",
    },
    {
      icon: Map,
      title: "Interactive Maps",
      description: "Explore detailed maps showing road conditions and reported anomalies in your area.",
    },
    {
      icon: BarChart,
      title: "Data Analytics",
      description: "Access comprehensive analytics about road conditions and improvement over time.",
    },
    {
      icon: Clock,
      title: "Historical Tracking",
      description: "Track the history of road conditions and monitor repair progress over time.",
    },
  ]

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our platform combines cutting-edge technology with user-friendly design to create the most comprehensive
            road anomaly mapping system.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
