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
    city: string;
    language: string | null;
    quotaType: string | null;
    durationYears: number;
}

export interface RankingDetail extends RankingItem {
    history: {
        year: number;
        score: number;
        rank: number | null;
        yerlesen: number;
        kontenjan: number;
    }[];
    description?: string;
    website?: string;
    contactEmail?: string;
}

export interface FilterOptions {
    years: number[];
    scoreTypes: string[];
    cities: string[];
    universities: string[];
    departments: string[];
    quotaTypes: string[];
}

export interface FilterState {
    searchQuery: string;
    year: number | null;
    scoreType: string | null;
    city: string | null;
    university: string | null;
    department: string | null;
    quotaType: string | null;
    language: string[] | null;
    // New filters
    minScore: number | null;
    maxScore: number | null;
    minRank: number | null;
    maxRank: number | null;
    sortBy: 'score' | 'rank' | 'quota' | 'year' | null;
    sortOrder: 'asc' | 'desc';
    selectedYksCalculationId: string | null;
}
