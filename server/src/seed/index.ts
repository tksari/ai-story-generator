/* eslint-disable no-console */
import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { seedAzure } from "./seeds/providers/azure/index.seed";
import { seedOpenAi } from "./seeds/providers/openai/index.seed";
import { seedElevenLabs } from "./seeds/providers/elevenlabs/index.seed";
import { seedLayouts } from "./seeds/layouts/index.seed";
import { seedSettings } from "./seeds/settings/index.seed";
import { prisma } from "../infrastructure/prisma/prisma";

const seeders: Record<string, (prisma: PrismaClient) => Promise<void>> = {
  azure: seedAzure,
  openai: seedOpenAi,
  elevenlabs: seedElevenLabs,
  layouts: seedLayouts,
  settings: seedSettings,
};

async function ensureDatabase() {
  try {
    await prisma.$connect();
    console.log("Database connected.");
  } catch {
    console.warn("Database not found. Trying to create via migration...");
    try {
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
    } catch (migrationError) {
      console.error("Failed to migrate or create DB:", migrationError);
      process.exit(1);
    }
  }
}

async function main() {
  const provider = process.argv[2] || "all";
  await ensureDatabase();

  console.log(`Seeding provider: ${provider}`);

  if (provider === "all") {
    for (const [name, seedFn] of Object.entries(seeders)) {
      console.log(`Seeding ${name}...`);
      await seedFn(prisma);
    }
  } else if (seeders[provider]) {
    console.log(`Seeding ${provider}...`);
    await seeders[provider](prisma);
  } else {
    console.error(`Unknown seed: ${provider}`);
    process.exit(1);
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
