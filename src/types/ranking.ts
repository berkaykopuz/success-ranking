export interface Program {
  program_id: number;
  university_id: number;
  university_name: string;
  location_city: string;
  university_type?: string;
  faculty: string;
  program_name: string;
  language?: string;
  duration_years: number;
  score_type: string;
  quota_type?: string;
}

export interface YearlyStat {
  id?: number; // Generated or rowid
  program_id: number;
  year: number;
  kontenjan: number; // quota
  yerlesen: number;
  taban_puan: number; // min_score
  basari_sirasi: number; // rank
  status?: string;
}

// Combined type for UI display
export interface ProgramWithStats extends Program {
  year: number;
  min_score: number;
  rank: number;
  quota: number;
}

export interface ProgramSearchFilters {
  universityName?: string;
  city?: string;
  faculty?: string;
  programName?: string;
  scoreType?: string;
  year?: number;
  minScore?: number;
  maxScore?: number;
  minRank?: number;
  maxRank?: number;
}

// Filter state for the rankings screen
export interface FilterState {
  searchQuery: string;
  year: number | null;
  scoreType: string | null;
  city: string | null;
  university: string | null;
  department: string | null;
  quotaType: string | null;
  language: string[] | null;
  minScore: number | null;
  maxScore: number | null;
  minRank: number | null;
  maxRank: number | null;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  selectedYksCalculationId: string | null;
}

// Filter options for dropdowns
export interface FilterOptions {
  years: number[];
  scoreTypes: string[];
  cities: string[];
  universities: string[];
  departments: string[];
  quotaTypes: string[];
}

// Ranking item for display in lists
export interface RankingItem {
  id: string;
  universityName: string;
  departmentName: string;
  faculty: string;
  scoreType: string;
  year: number;
  score: number;
  rank: number | null;
  quota: number;
  yerlesen: number;
  city: string;
  language: string | null;
  quotaType: string | null;
  durationYears: number;
}

// History entry for a ranking
export interface RankingHistoryEntry {
  year: number;
  score: number;
  rank: number | null;
  yerlesen: number;
  kontenjan: number;
}

// Detailed ranking information
export interface RankingDetail extends RankingItem {
  history: RankingHistoryEntry[];
  description: string;
  website: string;
}