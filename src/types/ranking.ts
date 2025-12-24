export interface RankingItem {
    id: string;
    universityName: string;
    departmentName: string;
    faculty: string;
    scoreType: string;
    year: number;
    score: number;
    rank: number;
    quota: number;
    city: string;
}

export interface RankingDetail extends RankingItem {
    history: {
        year: number;
        score: number;
        rank: number;
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
}

export interface FilterState {
    searchQuery: string;
    year: number | null;
    scoreType: string | null;
    city: string | null;
    university: string | null;
    department: string | null;
}
