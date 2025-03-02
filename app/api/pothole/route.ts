// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// import { NextRequest } from "next/server";

// const prisma = new PrismaClient();

// export async function GET(req: Request) {
//   const url = new URL(req.url);
//   const lat = parseFloat(url.searchParams.get("lat") || "0");
//   const lng = parseFloat(url.searchParams.get("lng") || "0");

//   if (!lat || !lng) {
//     return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
//   }

//   const potholes = await prisma.$queryRaw`
//     SELECT id, latitude, longitude, imageUrl,
//     (6371 * ACOS(COS(RADIANS(${lat})) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(${lng})) + SIN(RADIANS(${lat})) * SIN(RADIANS(latitude)))) 
//     AS distance
//     FROM "Pothole"
//     HAVING distance < 10
//     ORDER BY distance;
//   `;

//   return NextResponse.json(potholes);
// }

// File: app/api/potholes/route.js (for Next.js 13+)
// or: pages/api/potholes.js (for older Next.js versions)
// File: app/api/potholes/route.ts (for Next.js 13+ App Router)
import { NextRequest, NextResponse } from 'next/server';

interface Pothole {
  id: number;
  latitude: number;
  longitude: number;
  image_url: string;
  severity: string;
  reported_at: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '20.5937');
  const lng = parseFloat(searchParams.get('lng') || '78.9629');
  
  // Mock data with actual pothole images
  const mockPotholes: Pothole[] = [
    {
      id: 1,
      latitude: lat + 0.002,
      longitude: lng + 0.003,
      image_url: "https://www.thestructuralengineer.info/images/news/Large-Pothole.jpeg",
      severity: "high",
      reported_at: new Date().toISOString()
    },
    {
      id: 2,
      latitude: lat - 0.001,
      longitude: lng + 0.001,
      image_url: "https://images.theconversation.com/files/442675/original/file-20220126-19-1i2t7mk.jpg",
      severity: "medium",
      reported_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 3,
      latitude: lat + 0.0015,
      longitude: lng - 0.002,
      image_url: "https://www.tcsinc.org/wp-content/uploads/2021/08/pothole-road.jpg",
      severity: "low",
      reported_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    },
    {
      id: 4,
      latitude: lat - 0.0025,
      longitude: lng - 0.001,
      image_url: "https://media.istockphoto.com/id/1307113302/photo/deep-and-wide-water-filled-pot-holes-hampering-safe-transport-along-local-community-access.jpg",
      severity: "high",
      reported_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
    },
    {
      id: 5,
      latitude: lat + 0.003,
      longitude: lng - 0.003,
      image_url: "https://www.fox29.com/wp-content/uploads/2022/04/Pothole-City-Ave.jpg",
      severity: "medium",
      reported_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
    }
  ];

  // Return mock data with 200 status
  return NextResponse.json(mockPotholes);
}