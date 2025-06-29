import { PrismaClient, Provider, Voice, ProviderCapability } from "@prisma/client";
import { loadJsonFile } from "@/seed/utils/loader";

export async function seedAzure(prisma: PrismaClient) {
  try {
    const dir = __dirname;

    const provider = loadJsonFile<Provider>(`${dir}/data/providers.json`);
    const capabilities = loadJsonFile<ProviderCapability[]>(`${dir}/data/capabilities.json`);
    const voices = loadJsonFile<Voice[]>(`${dir}/data/voices.json`);

    const createdProvider = await prisma.provider.upsert({
      where: { code: provider.code },
      update: {},
      create: {
        code: provider.code,
        name: provider.name,
        description: provider.description,
        isActive: provider.isActive,
        apiKey: provider.apiKey,
        apiEndpoint: provider.apiEndpoint,
        region: provider.region,
        config: {},
      },
    });

    await prisma.providerCapability.createMany({
      data: capabilities.map((c: ProviderCapability) => ({
        providerId: createdProvider.id,
        type: c.type,
        configOptions: c.configOptions || {},
        isDefault: c.isDefault,
      })),
      skipDuplicates: true,
    });

    await prisma.voice.createMany({
      data: voices.map((v: Voice) => ({
        providerId: createdProvider.id,
        voiceId: v.voiceId,
        name: v.name,
        languages: v.languages || [],
        gender: v.gender,
        sampleRate: parseInt(v.sampleRate?.toString() || "16000"),
        isDefault: v.isDefault || false,
        isActive: v.isActive ?? true,
      })),
      skipDuplicates: true,
    });

    console.log("Azure seeding completed");
  } catch (error) {
    console.error("Error seeding Azure:", error);
    throw error;
  }
}
