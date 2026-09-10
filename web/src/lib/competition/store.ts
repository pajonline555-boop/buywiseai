import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction
} from 'firebase/firestore';

export type CompetitionStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'SUBMISSION_CLOSED'
  | 'VOTING_LIVE'
  | 'VOTING_CLOSED'
  | 'UNDER_VERIFICATION'
  | 'WINNER_DECLARED'
  | 'ARCHIVED'
  | 'CANCELLED';

export type SubmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'VOTING'
  | 'WINNER'
  | 'FEATURED'
  | 'WITHDRAWN';

const VALID_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
  DRAFT: ['SCHEDULED', 'LIVE', 'CANCELLED'],
  SCHEDULED: ['LIVE', 'DRAFT', 'CANCELLED'],
  LIVE: ['SUBMISSION_CLOSED', 'VOTING_LIVE', 'VOTING_CLOSED', 'CANCELLED'],
  SUBMISSION_CLOSED: ['VOTING_LIVE', 'VOTING_CLOSED', 'CANCELLED'],
  VOTING_LIVE: ['VOTING_CLOSED', 'CANCELLED'],
  VOTING_CLOSED: ['UNDER_VERIFICATION', 'WINNER_DECLARED', 'CANCELLED'],
  UNDER_VERIFICATION: ['WINNER_DECLARED', 'CANCELLED'],
  WINNER_DECLARED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: ['ARCHIVED']
};

export function validateStateTransition(current: CompetitionStatus, next: CompetitionStatus): boolean {
  if (current === next) return true;
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  featuredProductId: string;
  featuredProductTitle: string;
  featuredProductImage: string;
  featuredProductPrice: number;
  retailer: string;
  startDate: string;
  submissionCloseDate: string;
  votingStartDate: string;
  votingCloseDate: string;
  winnerAnnouncementDate: string;
  endDate: string;
  votingEndDate: string;
  status: CompetitionStatus;
  prizeDescription: string;
  eligibility: string;
  rules: string;
  termsVersion: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  votesFrozen?: boolean;
  winnerId?: string;
  winnerName?: string;
  environment?: string;
  isTest?: boolean;
}

export interface CompetitionSubmission {
  id: string;
  competitionId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  vtoResultImage: string;
  submittedAt: string;
  status: SubmissionStatus;
  voteCount: number;
  shareCount: number;
  consentAgreed: boolean;
  publicationConsentAgreed: boolean;
  moderatedBy?: string;
  rejectionReason?: string;
  environment?: string;
  isTest?: boolean;
}

export interface CompetitionVote {
  id: string;
  competitionId: string;
  submissionId: string;
  voterId: string;
  votedAt: string;
}

export function isTestRecord(item?: { id?: string; environment?: string; isTest?: boolean }): boolean {
  if (!item) return false;
  if (item.isTest === true || item.environment === 'TEST') return true;
  if (item.id && (
    item.id.includes('comp_test_phase8_2') ||
    item.id.includes('sub_test_phase8_2') ||
    item.id.includes('win_test_phase8_2') ||
    item.id.startsWith('test_')
  )) {
    return true;
  }
  return false;
}

// Initial fallback competitions
export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'comp-week-37-2026',
    title: 'Weekly BuyWise Fashion Challenge: Royal Kanjivaram Silk Saree',
    description: 'Try on this week\'s featured Kanjivaram Silk Saree, submit your look, and compete for the top community vote!',
    featuredProductId: 'prod-kanjivaram-silk-1',
    featuredProductTitle: 'Authentic Banarasi Kanjivaram Silk Saree in Crimson Gold',
    featuredProductImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    featuredProductPrice: 4999,
    retailer: 'Amazon India',
    startDate: '2026-09-07T00:00:00Z',
    submissionCloseDate: '2026-09-12T23:59:59Z',
    votingStartDate: '2026-09-07T00:00:00Z',
    votingCloseDate: '2026-09-13T18:00:00Z',
    winnerAnnouncementDate: '2026-09-13T20:00:00Z',
    endDate: '2026-09-12T23:59:59Z',
    votingEndDate: '2026-09-13T18:00:00Z',
    status: 'LIVE',
    prizeDescription: '₹5,000 Shopping Voucher + Featured Banner on BuyWise Home Screen',
    eligibility: 'All verified BuyWise registered shoppers in India',
    rules: 'One Try-On submission per user per week. Explicit consent required.',
    termsVersion: '1.0',
    createdBy: 'pajonline555@gmail.com',
    createdAt: '2026-09-07T00:00:00Z',
    updatedAt: '2026-09-07T00:00:00Z',
    votesFrozen: false,
    environment: 'PRODUCTION'
  },
  {
    id: 'comp-week-36-2026',
    title: 'Weekly BuyWise Fashion Challenge: Designer Anarkali Suit',
    description: 'Previous week\'s challenge featuring luxury embroidered Anarkali suits.',
    featuredProductId: 'prod-anarkali-suit-2',
    featuredProductTitle: 'Emerald Green Hand-Embroidered Anarkali Set',
    featuredProductImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    featuredProductPrice: 3850,
    retailer: 'Myntra',
    startDate: '2026-08-31T00:00:00Z',
    submissionCloseDate: '2026-09-05T23:59:59Z',
    votingStartDate: '2026-08-31T00:00:00Z',
    votingCloseDate: '2026-09-06T18:00:00Z',
    winnerAnnouncementDate: '2026-09-06T20:00:00Z',
    endDate: '2026-09-05T23:59:59Z',
    votingEndDate: '2026-09-06T18:00:00Z',
    status: 'WINNER_DECLARED',
    prizeDescription: '₹5,000 Shopping Voucher',
    eligibility: 'All registered shoppers',
    rules: 'One entry per user',
    termsVersion: '1.0',
    createdBy: 'pajonline555@gmail.com',
    createdAt: '2026-08-31T00:00:00Z',
    updatedAt: '2026-09-06T20:00:00Z',
    votesFrozen: true,
    environment: 'PRODUCTION'
  },
];

export const INITIAL_SUBMISSIONS: CompetitionSubmission[] = [
  {
    id: 'sub-37-1',
    competitionId: 'comp-week-37-2026',
    userId: 'user-priya-sharma',
    userName: 'Priya Sharma',
    userPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    vtoResultImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    submittedAt: '2026-09-08T14:20:00Z',
    status: 'APPROVED',
    voteCount: 142,
    shareCount: 28,
    consentAgreed: true,
    publicationConsentAgreed: true,
    environment: 'PRODUCTION'
  },
  {
    id: 'sub-37-2',
    competitionId: 'comp-week-37-2026',
    userId: 'user-ananya-roy',
    userName: 'Ananya Roy',
    userPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    vtoResultImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    submittedAt: '2026-09-08T16:45:00Z',
    status: 'APPROVED',
    voteCount: 118,
    shareCount: 19,
    consentAgreed: true,
    publicationConsentAgreed: true,
    environment: 'PRODUCTION'
  },
  {
    id: 'sub-36-winner',
    competitionId: 'comp-week-36-2026',
    userId: 'user-sneha-reddy',
    userName: 'Sneha Reddy',
    userPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    vtoResultImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    submittedAt: '2026-09-02T11:00:00Z',
    status: 'WINNER',
    voteCount: 1284,
    shareCount: 310,
    consentAgreed: true,
    publicationConsentAgreed: true,
    environment: 'PRODUCTION'
  },
];

export const INITIAL_VOTES: CompetitionVote[] = [];

// Local memory storage keys for client runtime persistence fallback
const STORAGE_COMPETITIONS_KEY = 'buywise_competitions_data';
const STORAGE_SUBMISSIONS_KEY = 'buywise_competition_submissions';
const STORAGE_VOTES_KEY = 'buywise_user_competition_votes';

export function getCompetitions(): Competition[] {
  let list: Competition[] = INITIAL_COMPETITIONS;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_COMPETITIONS_KEY);
      if (saved) list = JSON.parse(saved);
    } catch {
      list = INITIAL_COMPETITIONS;
    }
  }
  return list.filter(c => !isTestRecord(c));
}

export function getActiveCompetition(): Competition | undefined {
  const comps = getCompetitions();
  return comps.find(c => c.status === 'LIVE' && !isTestRecord(c)) || comps.find(c => !isTestRecord(c));
}

export function getSubmissions(competitionId?: string): CompetitionSubmission[] {
  let list: CompetitionSubmission[] = INITIAL_SUBMISSIONS;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_SUBMISSIONS_KEY);
      if (saved) list = JSON.parse(saved);
    } catch {
      list = INITIAL_SUBMISSIONS;
    }
  }
  let filtered = list.filter(s => !isTestRecord(s));
  if (competitionId) {
    filtered = filtered.filter(s => s.competitionId === competitionId);
  }
  return filtered;
}

export function saveSubmissions(list: CompetitionSubmission[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SUBMISSIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save submissions:', e);
    }
  }
}

export function saveCompetitions(list: Competition[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_COMPETITIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save competitions:', e);
    }
  }
}

export function getUserVotes(): CompetitionVote[] {
  if (typeof window === 'undefined') return INITIAL_VOTES;
  try {
    const saved = localStorage.getItem(STORAGE_VOTES_KEY);
    return saved ? JSON.parse(saved) : INITIAL_VOTES;
  } catch {
    return INITIAL_VOTES;
  }
}

export function hasUserVotedInCompetition(competitionId: string, voterId: string): boolean {
  const votes = getUserVotes();
  return votes.some(v => v.competitionId === competitionId && v.voterId === voterId);
}

export function castVote(competitionId: string, submissionId: string, voterId: string): { success: boolean; message: string } {
  if (hasUserVotedInCompetition(competitionId, voterId)) {
    return { success: false, message: 'You have already voted in this week\'s competition! One vote per user per competition.' };
  }

  const votes = getUserVotes();
  const newVote: CompetitionVote = {
    id: `vote-${Date.now()}`,
    competitionId,
    submissionId,
    voterId,
    votedAt: new Date().toISOString(),
  };
  votes.push(newVote);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_VOTES_KEY, JSON.stringify(votes));
  }

  const submissions = getSubmissions();
  const target = submissions.find(s => s.id === submissionId);
  if (target) {
    target.voteCount += 1;
    saveSubmissions(submissions);
  }

  return { success: true, message: '🎉 Your vote has been successfully cast!' };
}

export function submitToCompetition(
  competitionId: string,
  userId: string,
  userName: string,
  userPhotoUrl: string,
  vtoResultImage: string,
  caption?: string
): { success: boolean; submission?: CompetitionSubmission; message: string } {
  const submissions = getSubmissions();
  const existing = submissions.find(s => s.competitionId === competitionId && s.userId === userId && s.status !== 'REJECTED');
  if (existing) {
    return { success: false, message: 'You have already submitted an entry for this week\'s competition!' };
  }

  const newSubmission: CompetitionSubmission = {
    id: `sub-${Date.now()}`,
    competitionId,
    userId,
    userName,
    userPhotoUrl,
    vtoResultImage,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    voteCount: 0,
    shareCount: 0,
    consentAgreed: true,
    publicationConsentAgreed: true,
  };

  submissions.unshift(newSubmission);
  saveSubmissions(submissions);

  return { success: true, submission: newSubmission, message: '✨ Your Try-On look has been submitted for admin review!' };
}

export function getWinnerSubmission(competitionId: string): CompetitionSubmission | undefined {
  const submissions = getSubmissions(competitionId).filter(s => !isTestRecord(s));
  return submissions.find(s => s.status === 'WINNER') || submissions.sort((a, b) => b.voteCount - a.voteCount)[0];
}

export function adminCreateCompetition(data: Partial<Competition>): Competition {
  const competitions = getCompetitions();
  competitions.forEach(c => {
    if (c.status === 'LIVE') c.status = 'VOTING_CLOSED';
  });

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const newComp: Competition = {
    id: data.id || `comp-${Date.now()}`,
    title: data.title || 'Weekly BuyWise Try-On Challenge',
    description: data.description || 'Try on this featured product and win prizes!',
    featuredProductId: data.featuredProductId || `prod-${Date.now()}`,
    featuredProductTitle: data.featuredProductTitle || 'Featured Fashion Product',
    featuredProductImage: data.featuredProductImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    featuredProductPrice: data.featuredProductPrice || 2999,
    retailer: data.retailer || 'Amazon India',
    startDate: data.startDate || now.toISOString(),
    submissionCloseDate: data.submissionCloseDate || nextWeek.toISOString(),
    votingStartDate: data.votingStartDate || now.toISOString(),
    votingCloseDate: data.votingCloseDate || nextWeek.toISOString(),
    winnerAnnouncementDate: data.winnerAnnouncementDate || nextWeek.toISOString(),
    endDate: data.endDate || nextWeek.toISOString(),
    votingEndDate: data.votingEndDate || nextWeek.toISOString(),
    status: (data.status as CompetitionStatus) || 'LIVE',
    prizeDescription: data.prizeDescription || '₹5,000 Voucher',
    eligibility: data.eligibility || 'Registered Shoppers in India',
    rules: data.rules || 'One submission per user.',
    termsVersion: '1.0',
    createdBy: data.createdBy || 'pajonline555@gmail.com',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    votesFrozen: false,
  };

  competitions.unshift(newComp);
  saveCompetitions(competitions);
  return newComp;
}

export function adminDeclareWinner(competitionId: string): { success: boolean; winner?: CompetitionSubmission } {
  const competitions = getCompetitions();
  const comp = competitions.find(c => c.id === competitionId);
  if (!comp) return { success: false };

  const submissions = getSubmissions(competitionId);
  const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED' || s.status === 'VOTING');
  if (approvedSubmissions.length === 0) return { success: false };

  approvedSubmissions.sort((a, b) => b.voteCount - a.voteCount);
  const topSubmission = approvedSubmissions[0];

  submissions.forEach(s => {
    if (s.id === topSubmission.id) {
      s.status = 'WINNER';
    } else if (s.status === 'APPROVED') {
      s.status = 'FEATURED';
    }
  });

  comp.status = 'WINNER_DECLARED';
  comp.winnerId = topSubmission.id;
  comp.winnerName = topSubmission.userName;

  saveSubmissions(submissions);
  saveCompetitions(competitions);

  return { success: true, winner: topSubmission };
}

export function adminModerateSubmission(submissionId: string, status: SubmissionStatus, rejectionReason?: string) {
  const submissions = getSubmissions();
  const target = submissions.find(s => s.id === submissionId);
  if (target) {
    target.status = status;
    if (rejectionReason) target.rejectionReason = rejectionReason;
    saveSubmissions(submissions);
  }
}

// ----------------------------------------------------
// FIRESTORE ASYNC WRAPPER FUNCTIONS FOR REAL BACKEND
// ----------------------------------------------------

export async function fetchCompetitionsFromDb(): Promise<Competition[]> {
  try {
    const snap = await getDocs(collection(db, 'competitions'));
    if (snap.empty) return getCompetitions();
    return snap.docs.map(d => d.data() as Competition).filter(c => !isTestRecord(c));
  } catch (err) {
    console.warn('Firestore fetchCompetitions notice:', err);
    return getCompetitions();
  }
}

export async function fetchActiveCompetitionFromDb(): Promise<Competition | undefined> {
  try {
    const q = query(collection(db, 'competitions'), where('status', '==', 'LIVE'), limit(10));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const activeList = snap.docs.map(d => d.data() as Competition).filter(c => !isTestRecord(c));
      if (activeList.length > 0) return activeList[0];
    }
    return getActiveCompetition();
  } catch {
    return getActiveCompetition();
  }
}

export async function saveCompetitionToDb(comp: Competition): Promise<boolean> {
  try {
    await setDoc(doc(db, 'competitions', comp.id), comp);
    return true;
  } catch (err) {
    console.warn('Firestore saveCompetition error:', err);
    return false;
  }
}

export async function castVoteInDb(
  competitionId: string,
  submissionId: string,
  voterId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const voteDocId = `${competitionId}_${voterId}`;
    const voteRef = doc(db, 'competition_votes', voteDocId);
    const voteSnap = await getDoc(voteRef);

    if (voteSnap.exists()) {
      return { success: false, message: 'Duplicate vote rejected. One vote per user per competition.' };
    }

    const compRef = doc(db, 'competitions', competitionId);
    const compSnap = await getDoc(compRef);
    if (compSnap.exists() && compSnap.data()?.votesFrozen === true) {
      return { success: false, message: 'Voting is currently frozen by administration.' };
    }

    await setDoc(voteRef, {
      id: voteDocId,
      competitionId,
      submissionId,
      voterId,
      votedAt: new Date().toISOString()
    });

    const subRef = doc(db, 'competition_submissions', submissionId);
    await runTransaction(db, async (transaction) => {
      const sDoc = await transaction.get(subRef);
      if (sDoc.exists()) {
        const currentVotes = sDoc.data().voteCount || 0;
        transaction.update(subRef, { voteCount: currentVotes + 1 });
      }
    });

    return { success: true, message: '🎉 Vote transactionally recorded!' };
  } catch (err: any) {
    return castVote(competitionId, submissionId, voterId);
  }
}
