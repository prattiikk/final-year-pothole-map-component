// app/api/detections/[id]/fix/route.ts (Next.js App Router)

import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return Response.json({ message: 'Invalid detection ID' }, { status: 400 })
  }

  try {
    // Check if the detection exists
    const existingDetection = await prisma.detectionData.findUnique({
      where: { id },
      include: { detections: true }
    })

    if (!existingDetection) {
      return Response.json({ message: 'Detection not found' }, { status: 404 })
    }

    // Option 1: Delete the entire DetectionData record (cascades to Detection records)
    await prisma.detectionData.delete({
      where: { id }
    })

    // Option 2: Alternative - Update status to FIXED instead of deleting
    // await prisma.detectionData.update({
    //   where: { id },
    //   data: { 
    //     status: 'FIXED',
    //     updatedAt: new Date()
    //   }
    // })

    return Response.json({
      message: 'Pothole marked as fixed and removed successfully',
      deletedId: id
    })

  } catch (error) {
    console.error('Error marking pothole as fixed:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}