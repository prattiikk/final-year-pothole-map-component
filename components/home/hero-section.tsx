"use client"

import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown, MapPin, BarChart } from "lucide-react"
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
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0 opacity-30">
        <MapVisualization />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Mapping the <span className="text-primary">unseen</span> road
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
            Turn everyday drives into powerful data. Help authorities fix road hazards faster and get real-time road condition updates to plan safer, smarter commutes — all from your smartphone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
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
    if (typeof window === "undefined") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setCanvasDimensions = () => {
      if (typeof window !== "undefined") {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    const points: { x: number; y: number; size: number; speed: number; anomaly: boolean }[] = []
    const gridSize = 40
    const rows = Math.ceil(window.innerHeight / gridSize)
    const cols = Math.ceil(window.innerWidth / gridSize)

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const anomaly = Math.random() < 0.05
        points.push({
          x: j * gridSize,
          y: i * gridSize,
          size: anomaly ? 3 : 1,
          speed: anomaly ? 0.5 : 0.2,
          anomaly,
        })
      }
    }

    let animationFrameId: number
    let time = 0

    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      points.forEach((point) => {
        const offsetY = Math.sin(time * point.speed) * 5

        ctx.beginPath()
        ctx.arc(point.x, point.y + offsetY, point.size, 0, Math.PI * 2)

        ctx.fillStyle = point.anomaly
          ? getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
          : getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "20"

        ctx.fill()
      })

      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "10"
      ctx.lineWidth = 0.5

      for (let i = 0; i < points.length; i++) {
        const pointA = points[i]
        if (!pointA.anomaly) continue

        for (let j = 0; j < points.length; j++) {
          const pointB = points[j]
          const distance = Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(pointA.x, pointA.y + Math.sin(time * pointA.speed) * 5)
            ctx.lineTo(pointB.x, pointB.y + Math.sin(time * pointB.speed) * 5)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", setCanvasDimensions)
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full opacity-30" />
}