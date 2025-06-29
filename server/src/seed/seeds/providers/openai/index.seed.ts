import { PrismaClient, Provider, ProviderCapability } from "@prisma/client";
import { loadJsonFile } from "@/seed/utils/loader";

export async function seedOpenAi(prisma: PrismaClient) {
  try {
    const dir = __dirname;

    const provider = loadJsonFile<Provider>(`${dir}/data/providers.json`);
    const capabilities = loadJsonFile<ProviderCapability[]>(`${dir}/data/capabilities.json`);

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

    console.log("OpenAi seeding completed");
  } catch (error) {
    console.error("Error seeding OpenAi:", error);
    throw error;
  }
}
