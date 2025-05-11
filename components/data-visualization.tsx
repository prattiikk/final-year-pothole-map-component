"use client"

import { useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"

export function DataVisualization() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isInView) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.offsetWidth
        canvas.height = container.offsetHeight
      }
    }
    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Create road path
    const roadPath = [
      { x: 0, y: canvas.height / 2 },
      { x: canvas.width * 0.2, y: canvas.height * 0.4 },
      { x: canvas.width * 0.4, y: canvas.height * 0.6 },
      { x: canvas.width * 0.6, y: canvas.height * 0.3 },
      { x: canvas.width * 0.8, y: canvas.height * 0.7 },
      { x: canvas.width, y: canvas.height * 0.5 },
    ]

    // Create anomalies
    const anomalies = [
      { x: canvas.width * 0.25, y: canvas.height * 0.43, size: 15, type: "pothole" },
      { x: canvas.width * 0.5, y: canvas.height * 0.4, size: 10, type: "crack" },
      { x: canvas.width * 0.75, y: canvas.height * 0.65, size: 12, type: "pothole" },
    ]

    // Animation
    let animationFrameId: number
    let progress = 0
    let direction = 1

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw road
      ctx.beginPath()
      ctx.moveTo(roadPath[0].x, roadPath[0].y)

      for (let i = 1; i < roadPath.length; i++) {
        const xc = (roadPath[i].x + roadPath[i - 1].x) / 2
        const yc = (roadPath[i].y + roadPath[i - 1].y) / 2
        ctx.quadraticCurveTo(roadPath[i - 1].x, roadPath[i - 1].y, xc, yc)
      }

      ctx.lineTo(roadPath[roadPath.length - 1].x, roadPath[roadPath.length - 1].y)
      ctx.strokeStyle = "rgba(128, 128, 128, 0.4)" // Use a semi-transparent gray
      ctx.lineWidth = 20
      ctx.stroke()

      // Draw road markings
      ctx.beginPath()
      ctx.moveTo(roadPath[0].x, roadPath[0].y)

      for (let i = 1; i < roadPath.length; i++) {
        const xc = (roadPath[i].x + roadPath[i - 1].x) / 2
        const yc = (roadPath[i].y + roadPath[i - 1].y) / 2
        ctx.quadraticCurveTo(roadPath[i - 1].x, roadPath[i - 1].y, xc, yc)
      }

      ctx.lineTo(roadPath[roadPath.length - 1].x, roadPath[roadPath.length - 1].y)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)" // Use a semi-transparent white
      ctx.lineWidth = 2
      ctx.setLineDash([20, 20])
      ctx.stroke()
      ctx.setLineDash([])

      // Draw anomalies
      anomalies.forEach((anomaly) => {
        ctx.beginPath()
        ctx.arc(anomaly.x, anomaly.y, anomaly.size * (0.8 + Math.sin(progress * 2) * 0.2), 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)" // Use a simple red color with opacity
        ctx.fill()

        ctx.beginPath()
        ctx.arc(anomaly.x, anomaly.y, anomaly.size * 1.5, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(
          anomaly.x,
          anomaly.y,
          anomaly.size * 0.5,
          anomaly.x,
          anomaly.y,
          anomaly.size * 2,
        )
        gradient.addColorStop(0, "rgba(255, 0, 0, 0.4)") // Use rgba for the inner color
        gradient.addColorStop(1, "rgba(255, 0, 0, 0)") // Use rgba for the outer color
        ctx.fillStyle = gradient
        ctx.fill()
      })

      // Draw car
      const carPosition = progress * canvas.width
      let carX = 0
      let carY = 0

      // Find position on the curve
      if (carPosition < canvas.width) {
        const segment = Math.floor(carPosition / (canvas.width / (roadPath.length - 1)))
        const segmentProgress =
          (carPosition % (canvas.width / (roadPath.length - 1))) / (canvas.width / (roadPath.length - 1))

        if (segment < roadPath.length - 1) {
          carX = roadPath[segment].x + (roadPath[segment + 1].x - roadPath[segment].x) * segmentProgress
          carY = roadPath[segment].y + (roadPath[segment + 1].y - roadPath[segment].y) * segmentProgress
        }
      }

      ctx.beginPath()
      ctx.arc(carX, carY, 8, 0, Math.PI * 2)
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.fill()

      // Update progress
      progress += 0.001 * direction
      if (progress >= 1) {
        direction = -1
      } else if (progress <= 0) {
        direction = 1
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isInView])

  return (
    <section id="data" className="py-24 md:py-32 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-primary font-medium mb-3">Data Visualization</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">See what others miss</h2>
            <p className="text-foreground/70 text-lg mb-8">
              Our advanced algorithms detect and classify road anomalies with precision. From minor cracks to major
              potholes, we capture it all and present it in an intuitive visual format.
            </p>

            <div className="space-y-4">
              {[
                { label: "Detection Accuracy", value: "94%" },
                { label: "Average Response Time", value: "1.2s" },
                { label: "Daily Active Users", value: "12,500+" },
              ].map((stat, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-32 font-medium text-foreground/70">{stat.label}</div>
                  <div className="h-1 bg-muted flex-grow mx-4"></div>
                  <div className="text-xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div ref={ref} className="relative h-[400px] rounded-2xl overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
