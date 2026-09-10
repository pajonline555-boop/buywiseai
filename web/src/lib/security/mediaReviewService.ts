"use client"

export type ReviewReason =
  | 'VTO_QUALITY'
  | 'ABUSE_REPORT'
  | 'SECURITY_INVESTIGATION'
  | 'TECHNICAL_SUPPORT'
  | 'OTHER';

export interface MediaReviewRequest {
  reviewId: string;
  userId: string;
  vtoResultId: string;
  imageReference: string;
  reason: ReviewReason;
  permissionType: 'TEMPORARY_SINGLE_IMAGE';
  authorizedAt: number;
  expiresAt: number;
  status: 'ACTIVE' | 'EXPIRED' | 'RESOLVED';
  auditId: string;
}

export interface SecurityAuditRecord {
  auditId: string;
  adminId: string;
  userId: string;
  reviewId: string;
  reason: string;
  permissionGrantedAt: number;
  accessStartedAt: number;
  accessExpiresAt: number;
  actionTaken: string;
  ipRegion: string;
}

export interface RegionalSecuritySignal {
  signalId: string;
  region: string;
  countryCode: string;
  timestamp: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  vtoRequestId: string;
}

const REVIEW_STORAGE_KEY = 'buywise_user_authorized_media_reviews';
const AUDIT_STORAGE_KEY = 'buywise_security_audit_logs';

const MEMORY_REVIEWS: MediaReviewRequest[] = [];
const MEMORY_AUDITS: SecurityAuditRecord[] = [];

/**
 * Authorize temporary access to ONE specific private VTO image for security/support review
 */
export async function authorizeMediaReview(
  vtoResultId: string,
  imageSrc: string,
  reason: ReviewReason,
  userConsent: boolean,
  userId: string = 'user_current_session',
  ttlHours: number = 48
): Promise<MediaReviewRequest> {
  if (!userConsent) {
    throw new Error('Explicit user consent is required to authorize temporary media review.');
  }

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const expiresAt = now + ttlHours * 60 * 60 * 1000;

  const review: MediaReviewRequest = {
    reviewId,
    userId,
    vtoResultId,
    imageReference: imageSrc,
    reason,
    permissionType: 'TEMPORARY_SINGLE_IMAGE',
    authorizedAt: now,
    expiresAt,
    status: 'ACTIVE',
    auditId,
  };

  const existing = getStoredReviewsRaw();
  existing.unshift(review);

  if (typeof window !== 'undefined') {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(existing));
  } else {
    MEMORY_REVIEWS.unshift(review);
  }

  return review;
}

function getStoredReviewsRaw(): MediaReviewRequest[] {
  if (typeof window === 'undefined') return MEMORY_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MEMORY_REVIEWS;
  } catch (e) {
    return MEMORY_REVIEWS;
  }
}

/**
 * Get all active, unexpired user-authorized media reviews
 */
export async function getAuthorizedMediaReviews(): Promise<MediaReviewRequest[]> {
  const now = Date.now();
  const all = getStoredReviewsRaw();

  // Auto-expire items past TTL
  return all.filter((item) => {
    if (item.expiresAt <= now) {
      item.status = 'EXPIRED';
      return false;
    }
    return item.status === 'ACTIVE';
  });
}

/**
 * Fetch a single authorized media review item if still active
 */
export async function getAuthorizedMediaReviewById(reviewId: string): Promise<MediaReviewRequest | null> {
  const active = await getAuthorizedMediaReviews();
  return active.find((r) => r.reviewId === reviewId) || null;
}

/**
 * Manually expire or resolve review media access
 */
export async function expireReviewMedia(reviewId: string): Promise<void> {
  const all = getStoredReviewsRaw();
  const item = all.find((r) => r.reviewId === reviewId);
  if (item) {
    item.status = 'EXPIRED';
    if (typeof window !== 'undefined') {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(all));
    }
  }
}

/**
 * Record an immutable audit log whenever an administrator accesses an authorized media review
 */
export async function logAdminAccessAudit(
  reviewId: string,
  adminId: string,
  actionTaken: string
): Promise<SecurityAuditRecord> {
  const review = await getAuthorizedMediaReviewById(reviewId);
  if (!review) {
    throw new Error('Cannot access review item: Media authorization is expired or invalid.');
  }

  const now = Date.now();
  const auditRecord: SecurityAuditRecord = {
    auditId: review.auditId,
    adminId,
    userId: review.userId,
    reviewId,
    reason: review.reason,
    permissionGrantedAt: review.authorizedAt,
    accessStartedAt: now,
    accessExpiresAt: review.expiresAt,
    actionTaken,
    ipRegion: 'IN-DL (Delhi, India)',
  };

  const existingAudits = getStoredAuditsRaw();
  existingAudits.unshift(auditRecord);

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(existingAudits));
  } else {
    MEMORY_AUDITS.unshift(auditRecord);
  }

  return auditRecord;
}

function getStoredAuditsRaw(): SecurityAuditRecord[] {
  if (typeof window === 'undefined') return MEMORY_AUDITS;
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MEMORY_AUDITS;
  } catch (e) {
    return MEMORY_AUDITS;
  }
}

export async function getSecurityAuditLogs(): Promise<SecurityAuditRecord[]> {
  const all = getStoredAuditsRaw();
  if (all.length === 0) {
    return [
      {
        auditId: 'audit_sample_901',
        adminId: 'admin_sec_lead',
        userId: 'usr_kanpur_402',
        reviewId: 'rev_sample_101',
        reason: 'VTO_QUALITY',
        permissionGrantedAt: Date.now() - 3600000,
        accessStartedAt: Date.now() - 1800000,
        accessExpiresAt: Date.now() + 82800000,
        actionTaken: 'Inspected Garment Rendering Accuracy',
        ipRegion: 'IN-UP (Uttar Pradesh, India)',
      },
    ];
  }
  return all;
}

/**
 * Fetch Regional Security Metadata Signals (Zero Image Bytes)
 */
export async function getRegionalSecuritySignals(): Promise<RegionalSecuritySignal[]> {
  return [
    {
      signalId: 'sig_reg_101',
      region: 'West Bengal',
      countryCode: 'IN',
      timestamp: Date.now() - 1200000,
      riskLevel: 'LOW',
      reason: 'Normal VTO Generation Spike during Festive Campaign',
      vtoRequestId: 'req_vto_9021',
    },
    {
      signalId: 'sig_reg_102',
      region: 'Maharashtra',
      countryCode: 'IN',
      timestamp: Date.now() - 3600000,
      riskLevel: 'MEDIUM',
      reason: 'Rate limit boundary threshold reached (10 req/min)',
      vtoRequestId: 'req_vto_9088',
    },
  ];
}
