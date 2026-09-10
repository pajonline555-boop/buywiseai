import { vtoProviderRouter } from './providers/VtoProviderRouter';
import { VtoProviderConfig } from './types';

export function getVirtualTryOnProvider() {
  return vtoProviderRouter;
}

export function getVirtualTryOnProviderStatus(): VtoProviderConfig {
  const primary = vtoProviderRouter.selectPrimaryProvider();
  return {
    id: vtoProviderRouter.id,
    name: vtoProviderRouter.name,
    isConfigured: vtoProviderRouter.isConfigured(),
    modelName: primary ? primary.name : "No Provider Configured",
    statusMessage: `Router active. Primary: ${primary ? primary.name : "None"} (${primary ? primary.getLicenseStatus() : "DISABLED"}).`
  };
}
