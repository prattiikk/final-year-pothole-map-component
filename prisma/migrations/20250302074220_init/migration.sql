-- CreateTable
CREATE TABLE "Pothole" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "Pothole_pkey" PRIMARY KEY ("id")
);
