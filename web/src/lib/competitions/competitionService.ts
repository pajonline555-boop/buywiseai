"use client"

export interface CompetitionSubmission {
  submissionId: string;
  competitionId: string;
  userId: string;
  vtoResultId: string;
  submissionImageReference: string;
  submittedAt: number;
  consentVersion: string;
  consentTimestamp: number;
  visibility: 'PRIVATE' | 'SUBMITTED' | 'UNDER_REVIEW' | 'PUBLISHED' | 'WITHDRAWN' | 'REJECTED';
  status: 'ACTIVE' | 'WITHDRAWN' | 'REJECTED';
  withdrawnAt?: number;
}

const STORAGE_KEY = 'buywise_competition_submissions';
const MEMORY_SUBMISSIONS: CompetitionSubmission[] = [];

export async function submitToCompetition(
  vtoResultId: string,
  imageRef: string,
  consentAgreed: boolean,
  competitionId: string = 'comp_festive_looks_2026'
): Promise<CompetitionSubmission> {
  if (!consentAgreed) {
    throw new Error('Explicit consent is required to submit an image to a BuyWise competition.');
  }

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const submission: CompetitionSubmission = {
    submissionId,
    competitionId,
    userId: 'user_current_session',
    vtoResultId,
    submissionImageReference: imageRef,
    submittedAt: now,
    consentVersion: 'v1.0_2026',
    consentTimestamp: now,
    visibility: 'SUBMITTED', // Pending moderation / publication
    status: 'ACTIVE',
  };

  const existing = getStoredSubmissions();
  existing.unshift(submission);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } else {
    MEMORY_SUBMISSIONS.unshift(submission);
  }

  return submission;
}

export function getStoredSubmissions(): CompetitionSubmission[] {
  if (typeof window === 'undefined') return MEMORY_SUBMISSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : MEMORY_SUBMISSIONS;
  } catch (e) {
    return MEMORY_SUBMISSIONS;
  }
}

export async function withdrawSubmission(submissionId: string): Promise<CompetitionSubmission | null> {
  const existing = getStoredSubmissions();
  const index = existing.findIndex((s) => s.submissionId === submissionId);
  if (index === -1) return null;

  const updated: CompetitionSubmission = {
    ...existing[index],
    visibility: 'WITHDRAWN',
    status: 'WITHDRAWN',
    withdrawnAt: Date.now(),
  };

  existing[index] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }

  return updated;
}

/**
 * Public competition gallery fetcher - only returns PUBLISHED entries
 */
export async function getPublishedCompetitionGallery(
  competitionId: string = 'comp_festive_looks_2026'
): Promise<CompetitionSubmission[]> {
  const all = getStoredSubmissions();
  return all.filter((s) => s.competitionId === competitionId && s.visibility === 'PUBLISHED');
}
