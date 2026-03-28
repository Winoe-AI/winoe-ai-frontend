import type { CandidateSession } from '@/features/recruiter/types';

export type SearchState = {
  search: string;
  setSearch: (value: string) => void;
  pagedCandidates: CandidateSession[];
  visibleCandidates: CandidateSession[];
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
};
