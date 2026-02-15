import { MetadataKind, MetadataProvider, ProviderRegistration } from './types';

class ProviderRegistry {
  private kinds = new Map<string, MetadataKind>();
  private providers = new Map<string, ProviderRegistration>();

  registerKind(kind: MetadataKind): void {
    this.kinds.set(kind.id, kind);
  }

  registerProvider(registration: ProviderRegistration): void {
    if (registration.kind && !this.kinds.has(registration.kind)) {
      console.warn(
        `Provider '${registration.id}' references unknown kind '${registration.kind}'. ` + `Register the kind first.`,
      );
    }
    this.providers.set(registration.id, registration);
  }

  getKind(id: string): MetadataKind | undefined {
    return this.kinds.get(id);
  }

  getKinds(): MetadataKind[] {
    return Array.from(this.kinds.values());
  }

  getProviderRegistration(id: string): ProviderRegistration | undefined {
    return this.providers.get(id);
  }

  getProvidersForKind(kindId: string): ProviderRegistration[] {
    return Array.from(this.providers.values()).filter(p => p.kind === kindId);
  }

  createProvider(id: string, settings: Record<string, string>): MetadataProvider {
    const registration = this.providers.get(id);
    if (!registration) {
      throw new Error(`Provider '${id}' not found.`);
    }
    return registration.factory(settings);
  }
}

export const registry = new ProviderRegistry();
