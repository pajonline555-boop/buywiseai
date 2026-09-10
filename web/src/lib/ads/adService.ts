import { SubscriptionPlanId } from "../subscriptions/subscriptionTypes";

export type AdPlacementId =
  | "HOME_TOP_BANNER"
  | "HOME_MID_BANNER"
  | "GEN_G_BANNER"
  | "CATEGORY_BANNER"
  | "ARTICLE_INLINE"
  | "SEARCH_NATIVE"
  | "INTERSTITIAL"
  | "PROFILE_BANNER";

export interface AdCampaign {
  id: string;
  headline: string;
  description: string;
  ctaText: string;
  destinationUrl: string;
  imageUrl: string;
  placement: AdPlacementId;
  active: boolean;
  priority: number;
}

export const MOCK_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: "ad_amazon_great_indian_sale",
    headline: "Amazon Great Indian Festival Deal Hub",
    description: "Extra 10% instant discount on SBI credit cards + free express shipping.",
    ctaText: "Shop Festival Deals ➔",
    destinationUrl: "https://www.amazon.in/b?node=3474656031",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80",
    placement: "HOME_TOP_BANNER",
    active: true,
    priority: 10
  },
  {
    id: "ad_myntra_fashion_big_sale",
    headline: "Myntra Big Fashion Festival — Up to 80% OFF",
    description: "Top ethnic wear, sarees, sneakers, and handbags at verified lowest prices.",
    ctaText: "Explore Fashion Sales ➔",
    destinationUrl: "https://www.myntra.com/",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
    placement: "GEN_G_BANNER",
    active: true,
    priority: 9
  }
];

let lastInterstitialTimestamp = 0;
const INTERSTITIAL_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes frequency cap

export function canShowInterstitial(userPlan: SubscriptionPlanId): boolean {
  if (userPlan === "BUYWISE_ELITE") return false; // Ad-free for Elite
  const now = Date.now();
  if (now - lastInterstitialTimestamp >= INTERSTITIAL_COOLDOWN_MS) {
    return true;
  }
  return false;
}

export function recordInterstitialShown() {
  lastInterstitialTimestamp = Date.now();
}

export function getActiveAdForPlacement(placement: AdPlacementId, userPlan: SubscriptionPlanId): AdCampaign | null {
  if (userPlan === "BUYWISE_ELITE") return null; // Elite subscribers get 0 ads
  const matches = MOCK_AD_CAMPAIGNS.filter(c => c.placement === placement && c.active);
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.priority - a.priority);
  return matches[0];
}
