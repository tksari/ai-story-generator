import { inject, injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { Settings, UpdateSettings } from "@/domain/settings/settings.schema";

@injectable()
export class SettingsRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async getSettings(): Promise<Settings | null> {
    const settings = await this.prisma.settings.findFirst();
    return settings
      ? {
          apiBaseUrl: settings.apiBaseUrl,
          useFakeProvider: settings.useFakeProvider,
          theme: settings.theme as "light" | "dark" | "system",
        }
      : null;
  }

  async createSettings(data: Settings): Promise<Settings> {
    const settings = await this.prisma.settings.create({
      data: {
        apiBaseUrl: data.apiBaseUrl,
        useFakeProvider: data.useFakeProvider,
        theme: data.theme,
      },
    });

    return {
      apiBaseUrl: settings.apiBaseUrl,
      useFakeProvider: settings.useFakeProvider,
      theme: settings.theme as "light" | "dark" | "system",
    };
  }

  async updateSettings(data: UpdateSettings): Promise<Settings> {
    const existingSettings = await this.prisma.settings.findFirst();

    if (!existingSettings) {
      return this.createSettings(data as Settings);
    }

    const settings = await this.prisma.settings.update({
      where: { id: existingSettings.id },
      data: {
        ...(data.apiBaseUrl !== undefined && { apiBaseUrl: data.apiBaseUrl }),
        ...(data.useFakeProvider !== undefined && {
          useFakeProvider: data.useFakeProvider,
        }),
        ...(data.theme !== undefined && { theme: data.theme }),
      },
    });

    return {
      apiBaseUrl: settings.apiBaseUrl,
      useFakeProvider: settings.useFakeProvider,
      theme: settings.theme as "light" | "dark" | "system",
    };
  }
}
