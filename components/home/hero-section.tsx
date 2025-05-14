"use client"

import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown, Camera, MapPin, BarChart, Shield } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity, scale, y }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <MapVisualization />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
            Mapping the <span className="text-primary">unseen</span> road
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Transform your daily commute data into actionable insights. Identify road anomalies in real-time using your
            dashcam or smartphone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/map">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              View Map
            </motion.button>
          </Link>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full bg-background border border-border text-foreground font-medium flex items-center gap-2"
            >
              <BarChart className="h-4 w-4" />
              View Dashboard
            </motion.button>
          </Link>
          <Link href="https://report.roadsense.com" target="_blank" rel="noopener noreferrer">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full bg-green-600 text-white font-medium flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Report Pothole
            </motion.button>
          </Link>
        </motion.div>

        {/* User types section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"
        >
          {/* For Drivers */}
          <div className="bg-background/30 backdrop-blur-sm p-6 rounded-xl border border-border/50">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 mx-auto">
              <MapPin className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">For Drivers & Commuters</h3>
            <ul className="text-left space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" />
                </span>
                <span>Plan smoother journeys by avoiding pothole-heavy routes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" />
                </span>
                <span>Get real-time alerts about road hazards on your route</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-500/20 text-blue-500 rounded-full p-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" />
                </span>
                <span>Contribute to safer roads by reporting potholes you encounter</span>
              </li>
            </ul>
            <Link href="/map">
              <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Explore Map
              </button>
            </Link>
          </div>

          {/* For Agencies */}
          <div className="bg-background/30 backdrop-blur-sm p-6 rounded-xl border border-border/50">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 mx-auto">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">For Agencies & Authorities</h3>
            <ul className="text-left space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="bg-green-500/20 text-green-500 rounded-full p-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" />
                </span>
                <span>Access comprehensive analytics on road conditions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-500/20 text-green-500 rounded-full p-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" />
                </span>
                <span>Prioritize repairs based on severity and traffic impact</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-500/20 text-green-500 rounded-full p-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" />
                </span>
                <span>Track repair progress and monitor recurring issues</span>
              </li>
            </ul>
            <Link href="/dashboard">
              <button className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                View Dashboard
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}>
            <ArrowDown className="h-6 w-6 text-foreground/60" />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}

function MapVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Create grid points
    const points: { x: number; y: number; size: number; speed: number; anomaly: boolean }[] = []
    const gridSize = 40
    const rows = Math.ceil(canvas.height / gridSize)
    const cols = Math.ceil(canvas.width / gridSize)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const anomaly = Math.random() < 0.05 // 5% chance of being an anomaly
        points.push({
          x: j * gridSize,
          y: i * gridSize,
          size: anomaly ? 3 : 1,
          speed: anomaly ? 0.5 : 0.2,
          anomaly,
        })
      }
    }

    // Animation
    let animationFrameId: number
    let time = 0

    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid points
      points.forEach((point) => {
        const offsetY = Math.sin(time * point.speed) * 5

        ctx.beginPath()
        ctx.arc(point.x, point.y + offsetY, point.size, 0, Math.PI * 2)

        if (point.anomaly) {
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
        } else {
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "20"
        }

        ctx.fill()
      })

      // Draw connecting lines
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "10"
      ctx.lineWidth = 0.5

      for (let i = 0; i < points.length; i++) {
        const pointA = points[i]
        if (pointA.anomaly) {
          for (let j = 0; j < points.length; j++) {
            const pointB = points[j]
            const distance = Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2))

            if (distance < 100) {
              ctx.beginPath()
              ctx.moveTo(pointA.x, pointA.y + Math.sin(time * pointA.speed) * 5)
              ctx.lineTo(pointB.x, pointB.y + Math.sin(time * pointB.speed) * 5)
              ctx.stroke()
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full opacity-30" />
}
