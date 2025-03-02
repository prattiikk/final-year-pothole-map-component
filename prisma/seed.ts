import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.pothole.deleteMany(); // Clear existing data

  await prisma.pothole.createMany({
    data: [
      { latitude: 18.5289, longitude: 73.8741, imageUrl: "https://via.placeholder.com/150" },
      { latitude: 18.5295, longitude: 73.8750, imageUrl: "https://via.placeholder.com/150" },
      { latitude: 18.5300, longitude: 73.8735, imageUrl: "https://via.placeholder.com/150" },
      { latitude: 18.5278, longitude: 73.8728, imageUrl: "https://via.placeholder.com/150" }
    ],
  });

  console.log("✅ Seeded potholes near Pune Railway Station!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());