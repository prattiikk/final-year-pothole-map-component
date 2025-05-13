"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Cpu, Smartphone, Database, Zap, Code, Share2 } from "lucide-react"

export function TechInnovationSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const technologies = [
    {
      icon: Cpu,
      title: "AI-Powered Detection",
      description:
        "Our advanced machine learning algorithms can identify and classify road anomalies with over 95% accuracy.",
    },
    {
      icon: Smartphone,
      title: "Mobile Integration",
      description: "Seamlessly connect your smartphone or dashcam to capture and report road conditions in real-time.",
    },
    {
      icon: Database,
      title: "Cloud Processing",
      description: "All data is processed in the cloud, allowing for fast analysis and minimal device resource usage.",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Get instant notifications about road hazards on your route before you encounter them.",
    },
    {
      icon: Code,
      title: "Open API",
      description: "Integrate our road data into your own applications with our comprehensive developer API.",
    },
    {
      icon: Share2,
      title: "Data Sharing",
      description: "Contribute to a global database of road conditions that helps improve infrastructure worldwide.",
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
    <section id="technology" className="py-24 md:py-32 px-6 relative overflow-hidden">
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
          <span className="inline-block text-primary font-medium mb-3">Technology</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Cutting-edge Innovation</h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Our platform leverages the latest technologies to provide the most accurate and reliable road condition
            data.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-background rounded-xl border border-border/50 p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <tech.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{tech.title}</h3>
              <p className="text-foreground/70">{tech.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 bg-primary/10 rounded-2xl p-8 border border-primary/20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Technology Stack</h3>
              <p className="text-foreground/70 mb-6">
                We&apos;ve built our platform using cutting-edge technologies to ensure reliability, scalability, and
                performance.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-32 font-medium">Frontend</div>
                  <div className="h-1 bg-muted flex-grow mx-4"></div>
                  <div className="text-primary font-semibold">Next.js, React, TypeScript</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 font-medium">Backend</div>
                  <div className="h-1 bg-muted flex-grow mx-4"></div>
                  <div className="text-primary font-semibold">Node.js, PostgreSQL</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 font-medium">AI/ML</div>
                  <div className="h-1 bg-muted flex-grow mx-4"></div>
                  <div className="text-primary font-semibold">TensorFlow, PyTorch</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 font-medium">Deployment</div>
                  <div className="h-1 bg-muted flex-grow mx-4"></div>
                  <div className="text-primary font-semibold">Docker, Kubernetes, AWS</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative bg-background rounded-xl overflow-hidden border border-border/50">
                <div className="p-6">
                  <pre className="text-xs text-foreground/80 overflow-x-auto">
                    <code>{`// AI-powered pothole detection
import { detectAnomalies } from '@/lib/ai';

async function processImage(imageData) {
  // Process image with our AI model
  const results = await detectAnomalies(imageData);
  
  // Filter high-confidence detections
  const detections = results.filter(
    detection => detection.confidence > 0.85
  );
  
  // Classify by severity
  return detections.map(detection => ({
    ...detection,
    severity: calculateSeverity(detection),
    location: getGeoLocation(detection)
  }));
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
