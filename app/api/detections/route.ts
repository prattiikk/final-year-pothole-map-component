

"use server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    console.log("url : ", url);
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lon = parseFloat(url.searchParams.get("lng") || "");
    const radius = parseFloat(url.searchParams.get("radius") || "");
    const severity = url.searchParams.get("severity") || null; // Optional severity filter
    const status = url.searchParams.get("status") || null; // Optional status filter
    const days = parseInt(url.searchParams.get("days") || "30"); // Optional time filter, default 30 days

    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Calculate date for time filtering
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query conditions
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
      latitude: { lte: lat + radius, gte: lat - radius },
      longitude: { lte: lon + radius, gte: lon - radius },
      createdAt: { gte: startDate },
      totalDetections: { gt: 0 } // Only return detections with at least one detection
    };

    // Add optional filters if provided
    if (severity) {
      whereConditions.highestSeverity = severity.toUpperCase();
    }

    if (status) {
      whereConditions.status = status.toUpperCase();
    }

    // Fetch detection data
    const detectionData = await prisma.detectionData.findMany({
      where: whereConditions,
      include: {
        detections: true // Include the related individual detections
      },
      orderBy: {
        createdAt: 'desc' // Most recent first
      }
    });

    // Transform data for frontend use
    const transformedData = detectionData.map(detection => {
      // Parse JSON strings
      // const rawDetections = JSON.parse(detection.rawDetections);
      const counts = JSON.parse(detection.counts);
      
      // Transform individual detections
      const detections = detection.detections.map(item => {
        return {
          ...item,
          bbox: JSON.parse(item.bbox),
          center: JSON.parse(item.center),
          relativePosition: item.relativePosition ? JSON.parse(item.relativePosition) : null
        };
      });

      // Return transformed detection
      return {
        id: detection.id,
        location: {
          latitude: detection.latitude,
          longitude: detection.longitude,
          accuracy: detection.accuracyMeters
        },
        images: {
          original: detection.originalImage,
          annotated: detection.annotatedImage
        },
        metadata: {
          userId: detection.userId,
          username: detection.username,
          createdAt: detection.createdAt,
          updatedAt: detection.updatedAt,
          notes: detection.notes || ""
        },
        detection: {
          totalDetections: detection.totalDetections,
          averageConfidence: detection.averageConfidence,
          processingTimeMs: detection.processingTimeMs,
          highestSeverity: detection.highestSeverity,
          status: detection.status,
          counts: counts,
          details: detections
        }
      };
    });

    console.log(`Found ${transformedData.length} detections within radius`);
    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error("Error fetching detection data:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}