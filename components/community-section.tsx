"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { MapPin } from "lucide-react"

export function CommunitySection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Daily Commuter",
      content: "This app has transformed my daily drive. I've avoided countless potholes thanks to the alerts.",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Sarah Chen",
      role: "City Planner",
      content: "The data we get from this platform has revolutionized how we prioritize road repairs.",
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Michael Rodriguez",
      role: "Rideshare Driver",
      content: "As someone who drives 8+ hours daily, this tool has saved my car from so much damage.",
      avatar: "/placeholder.svg?height=80&width=80",
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
    <section id="community" className="py-24 md:py-32 px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-medium mb-3">Community</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Join thousands making roads safer</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <p className="text-lg text-foreground/70 mb-6">
                Our community of drivers, cyclists, and pedestrians work together to create a comprehensive map of road
                conditions. Every contribution helps make journeys safer for everyone.
              </p>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">250K+</div>
                  <div className="text-sm text-foreground/70">Active Users</div>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1.2M+</div>
                  <div className="text-sm text-foreground/70">Reports Filed</div>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">85K+</div>
                  <div className="text-sm text-foreground/70">Issues Fixed</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-muted/50 rounded-2xl p-6 border border-border/50">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-semibold">Global Impact</h3>
                </div>
                <div className="h-[200px] rounded-lg overflow-hidden bg-background/50">
                  <div className="w-full h-full bg-[url('/placeholder.svg?height=400&width=600')] bg-cover bg-center opacity-70"></div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="space-y-6"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-background rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors duration-300"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <img
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground/80 mb-3">{testimonial.content}</p>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-foreground/60">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div variants={itemVariants} className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
              <h3 className="font-semibold mb-4">Ready to join our community?</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow px-4 py-2 rounded-l-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-r-lg font-medium">
                  Join Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
