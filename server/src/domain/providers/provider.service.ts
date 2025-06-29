import { inject, injectable } from "tsyringe";
import { Provider } from "@prisma/client";
import { ProviderRepository } from "@/domain/providers/provider.repository";
import { CreateProviderInput, UpdateProviderInput } from "@/types/provider.types";

@injectable()
export class ProviderService {
  constructor(
    @inject("ProviderRepository")
    private providerRepository: ProviderRepository
  ) {}

  async getProviderByCode(code: string): Promise<Provider | null> {
    return this.providerRepository.findProviderByCode(code);
  }

  async create(providerData: CreateProviderInput): Promise<Provider> {
    const existingProvider = await this.providerRepository.findProviderByCode(providerData.code);
    if (existingProvider) {
      throw new Error(`Provider with code '${providerData.code}' already exists`);
    }

    return this.providerRepository.create(providerData);
  }

  async update(id: number, data: UpdateProviderInput): Promise<Provider> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new Error(`Provider with ID ${id} not found`);
    }

    return this.providerRepository.updateById(id, data);
  }

  async delete(id: number): Promise<Provider> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new Error(`Provider with ID ${id} not found`);
    }

    return this.providerRepository.deleteById(id);
  }
}
