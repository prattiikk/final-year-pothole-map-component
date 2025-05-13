"use client"

import { motion } from "framer-motion"
import { Camera, Upload, Cpu, MapPin, CheckCircle } from "lucide-react"
import Link from "next/link"

export function IntegratedPlatform() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-medium mb-3">Integrated Platform</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">One Ecosystem for Road Safety</h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Our comprehensive platform combines multiple tools to create a seamless experience for reporting, analyzing,
            and fixing road anomalies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-background rounded-xl overflow-hidden shadow-xl border border-border/50 p-6">
              <div className="relative">
                {/* Flow diagram */}
                <div className="flex flex-col items-center">
                  {/* Step 1 */}
                  <div className="flex items-center gap-4 mb-8 w-full">
                    <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Camera className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-lg flex-grow">
                      <h3 className="font-semibold text-blue-500">Capture</h3>
                      <p className="text-sm">Use your mobile as a dashcam to record road conditions</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="h-8 border-l-2 border-dashed border-primary/50"></div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-4 mb-8 w-full">
                    <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Upload className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="bg-purple-500/10 p-4 rounded-lg flex-grow">
                      <h3 className="font-semibold text-purple-500">Upload</h3>
                      <p className="text-sm">Submit footage to our reporting platform</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="h-8 border-l-2 border-dashed border-primary/50"></div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-4 mb-8 w-full">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Cpu className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-lg flex-grow">
                      <h3 className="font-semibold text-green-500">AI Processing</h3>
                      <p className="text-sm">Our AI automatically detects and classifies road anomalies</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="h-8 border-l-2 border-dashed border-primary/50"></div>

                  {/* Step 4 */}
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg flex-grow">
                      <h3 className="font-semibold text-primary">Map Integration</h3>
                      <p className="text-sm">Detected potholes are automatically added to our interactive map</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h3 className="text-2xl font-bold">How Our Integrated Platform Works</h3>

            <p className="text-foreground/70">
              RoadSense combines two powerful tools into one ecosystem to create a comprehensive solution for road
              anomaly detection and management.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold">Reporting Platform</h4>
                  <p className="text-sm text-foreground/70">
                    Our mobile dashcam app allows users to record and submit footage of road conditions. AI
                    automatically detects potholes and other anomalies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold">Mapping & Analytics Platform</h4>
                  <p className="text-sm text-foreground/70">
                    This platform (RoadSense) displays all detected anomalies on an interactive map and provides
                    comprehensive analytics for users and agencies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold">Seamless Integration</h4>
                  <p className="text-sm text-foreground/70">
                    Data flows automatically between both platforms, creating a complete ecosystem for reporting,
                    analyzing, and fixing road issues.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link href="https://report.roadsense.com" target="_blank" rel="noopener noreferrer">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
                  <Camera className="h-5 w-5" />
                  Try Our Reporting Platform
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
