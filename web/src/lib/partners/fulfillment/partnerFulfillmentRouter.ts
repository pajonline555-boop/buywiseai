import { FulfillmentMethod, PartnerFulfillmentProvider } from './fulfillmentTypes';
import { ManualPartnerProvider } from './manualPartnerProvider';
import { ApiPartnerProvider } from './apiPartnerProvider';
import { SecureEmailPartnerProvider } from './secureEmailPartnerProvider';

const manualProvider = new ManualPartnerProvider();
const apiProvider = new ApiPartnerProvider();
const secureEmailProvider = new SecureEmailPartnerProvider();

/**
 * Resolves the operational PartnerFulfillmentProvider based on product or partner configuration.
 */
export function getPartnerFulfillmentProvider(method?: FulfillmentMethod): PartnerFulfillmentProvider {
  switch (method) {
    case 'PARTNER_API':
      return apiProvider;
    case 'SECURE_EMAIL':
      return secureEmailProvider;
    case 'MANUAL_ADMIN':
    case 'PARTNER_PORTAL':
    default:
      return manualProvider;
  }
}
