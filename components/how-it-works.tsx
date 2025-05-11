"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

export function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const steps = [
    {
      number: "01",
      title: "Record",
      description: "Capture road conditions using your dashcam or smartphone while driving.",
    },
    {
      number: "02",
      title: "Analyze",
      description: "Our AI automatically identifies and classifies road anomalies from your footage.",
    },
    {
      number: "03",
      title: "Map",
      description: "Detected issues are precisely geolocated and added to our interactive map.",
    },
    {
      number: "04",
      title: "Share",
      description: "Data is anonymously shared with other users and relevant authorities.",
    },
  ]

  return (
    <section id="how-it-works" className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our streamlined process makes it easy to contribute to safer roads for everyone.
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
                className={`md:flex items-center ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } gap-8 md:h-48`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <h3 className="text-5xl font-bold text-primary/20">{step.number}</h3>
                  <h4 className="text-2xl font-semibold mt-2">{step.title}</h4>
                  <p className="text-muted-foreground mt-2">{step.description}</p>
                </div>

                <div className="hidden md:flex items-center justify-center relative">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center z-10">
                    <span className="text-primary-foreground font-bold">{index + 1}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="h-full w-full rounded-xl overflow-hidden">
                    <div className="h-48 w-full bg-[url('/placeholder.svg?height=400&width=600')] bg-cover bg-center"></div>
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
