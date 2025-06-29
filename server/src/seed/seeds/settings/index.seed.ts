import { PrismaClient } from "@prisma/client";
import { loadJsonFile } from "@/seed/utils/loader";

interface SettingsData {
  apiBaseUrl: string;
  useFakeProvider: boolean;
  theme: string;
}

export async function seedSettings(prisma: PrismaClient) {
  try {
    const dir = __dirname;
    const settings = loadJsonFile<SettingsData>(`${dir}/data/settings.json`);

    await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        apiBaseUrl: settings.apiBaseUrl,
        useFakeProvider: settings.useFakeProvider,
        theme: settings.theme,
      },
      create: {
        id: 1,
        apiBaseUrl: settings.apiBaseUrl,
        useFakeProvider: settings.useFakeProvider,
        theme: settings.theme,
      },
    });

    console.log("UserSettings seeding completed");
  } catch (error) {
    console.error("Error seeding UserSettings:", error);
    throw error;
  }
}
