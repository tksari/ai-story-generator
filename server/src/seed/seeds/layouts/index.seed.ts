import { PrismaClient } from "@prisma/client";
import { loadJsonFile } from "@/seed/utils/loader";

interface LayoutData {
  name: string;
  items: any;
}

export async function seedLayouts(prisma: PrismaClient) {
  try {
    const dir = __dirname;
    const layouts = loadJsonFile<LayoutData[]>(`${dir}/data/layouts.json`);

    await prisma.videoLayout.createMany({
      data: layouts.map((layout: LayoutData) => ({
        name: layout.name,
        items: layout.items,
      })),
      skipDuplicates: true,
    });

    console.log("Layouts seeding completed");
  } catch (error) {
    console.error("Error seeding layouts:", error);
    throw error;
  }
}
