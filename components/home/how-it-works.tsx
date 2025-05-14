"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Smartphone, Server, Database, Map, ArrowRight } from "lucide-react"

export function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const steps = [
    {
      number: "01",
      title: "Record",
      description:
        "Use your smartphone as a dashcam to capture road conditions while driving. The app automatically records footage based on your vehicle's speed.",
      icon: Smartphone,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      number: "02",
      title: "Process",
      description:
        "Footage is transmitted to our backend servers where frames are extracted and processed through our AI models to detect road anomalies.",
      icon: Server,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      number: "03",
      title: "Store",
      description:
        "AI-processed data is stored in our database with precise geolocation, severity ratings, and confidence scores for each detected anomaly.",
      icon: Database,
      color: "bg-green-500/10 text-green-500",
    },
    {
      number: "04",
      title: "Visualize",
      description:
        "The map component utilizes the processed data to display relevant information, helping users and authorities identify problem areas.",
      icon: Map,
      color: "bg-purple-500/10 text-purple-500",
    },
  ]

  return (
    <section id="how-it-works" className="py-20  bg-black">
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
            Our streamlined process makes it easy to contribute to safer roads for everyone, turning your daily commute
            into valuable data.
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
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center z-10">
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

        {/* Data flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-20 bg-card rounded-xl border border-border/50 p-6 shadow-sm"
        >
          <h3 className="text-xl font-semibold mb-6 text-center">Data Flow Process</h3>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg w-full md:w-1/4">
              <Smartphone className="h-10 w-10 text-blue-500 mb-2" />
              <h4 className="font-medium">Mobile App</h4>
              <p className="text-xs text-muted-foreground mt-1">Captures video frames based on vehicle speed</p>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="w-0.5 h-6 bg-muted-foreground md:hidden"></div>

            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg w-full md:w-1/4">
              <Server className="h-10 w-10 text-amber-500 mb-2" />
              <h4 className="font-medium">AI Processing</h4>
              <p className="text-xs text-muted-foreground mt-1">Detects anomalies with 95% accuracy</p>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="w-0.5 h-6 bg-muted-foreground md:hidden"></div>

            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg w-full md:w-1/4">
              <Database className="h-10 w-10 text-green-500 mb-2" />
              <h4 className="font-medium">Database</h4>
              <p className="text-xs text-muted-foreground mt-1">Stores location, severity, and metadata</p>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
            <div className="w-0.5 h-6 bg-muted-foreground md:hidden"></div>

            <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg w-full md:w-1/4">
              <Map className="h-10 w-10 text-purple-500 mb-2" />
              <h4 className="font-medium">Map Interface</h4>
              <p className="text-xs text-muted-foreground mt-1">Visualizes data for users and authorities</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
