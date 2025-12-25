import rawData from '../../outputjson.json';
import { FilterOptions, FilterState, RankingDetail, RankingItem } from '../types/ranking';

// Define the shape of the raw JSON item
interface RawRankingItem {
    ProgramCode: string;
    UniversityType: string;
    UniversityName: string;
    FacultyName: string;
    ProgramName: string;
    ScoreType: string;
    General: {
        Quota: number;
        Placed: number;
        MinScore: number | null;
        MaxScore: number | null;
    };
    // ... other fields can be ignored for now
}

// 1. Pre-process data: Parse and Normalize
const processedData: RankingItem[] = (rawData as unknown as RawRankingItem[])
    .map((item) => {
        // Extract city from UniversityName "UNIVERSITY (CITY)"
        const cityMatch = item.UniversityName.match(/\(([^)]+)\)$/);
        const city = cityMatch ? cityMatch[1] : 'Bilinmiyor';
        const universityName = item.UniversityName.replace(/\s*\([^)]+\)$/, '');

        return {
            id: item.ProgramCode,
            universityName: universityName,
            departmentName: item.ProgramName,
            faculty: item.FacultyName,
            scoreType: item.ScoreType,
            year: 2024, // Default year as it's missing in JSON
            score: item.General.MinScore || 0,
            rank: 0, // Placeholder, will calculate below
            quota: item.General.Quota,
            city: city,
        };
    })
    .filter(item => item.score > 0); // Remove items without valid score

// 2. Pre-process data: Calculate Global Ranks per ScoreType
// Identify unique score types
const scoreTypes = Array.from(new Set(processedData.map(d => d.scoreType)));

// Create a map to store ranked lists for faster access if needed, 
// or just update rank in the main array.
scoreTypes.forEach(type => {
    // Get items of this type
    const items = processedData.filter(d => d.scoreType === type);
    // Sort by score descending
    items.sort((a, b) => b.score - a.score);
    // Assign rank
    items.forEach((item, index) => {
        item.rank = index + 1;
    });
});

// Helper for search
const matchesSearch = (item: RankingItem, query: string) => {
    const q = query.toLocaleLowerCase('tr-TR');
    return (
        item.universityName.toLocaleLowerCase('tr-TR').includes(q) ||
        item.departmentName.toLocaleLowerCase('tr-TR').includes(q) ||
        item.faculty.toLocaleLowerCase('tr-TR').includes(q)
    );
};

interface FetchRankingsResponse {
    data: RankingItem[];
    nextCursor: number | null;
}

export const fetchRankings = async (
    pageParam: number = 0,
    filters: FilterState
): Promise<FetchRankingsResponse> => {
    // Simulate network delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = processedData;

    // Apply Filters
    // Apply Filters
    if (filters.scoreType) {
        filtered = filtered.filter(item => item.scoreType === filters.scoreType);
    }
    if (filters.city) {
        const cityFilter = filters.city.toLocaleLowerCase('tr-TR');
        filtered = filtered.filter(item => item.city.toLocaleLowerCase('tr-TR').includes(cityFilter));
    }
    if (filters.university) {
        const uniFilter = filters.university.toLocaleLowerCase('tr-TR');
        filtered = filtered.filter(item => item.universityName.toLocaleLowerCase('tr-TR').includes(uniFilter));
    }
    if (filters.department) {
        const deptFilter = filters.department.toLocaleLowerCase('tr-TR');
        filtered = filtered.filter(item => item.departmentName.toLocaleLowerCase('tr-TR').includes(deptFilter));
    }
    if (filters.searchQuery) {
        filtered = filtered.filter(item => matchesSearch(item, filters.searchQuery));
    }
    if (filters.minScore !== null) {
        filtered = filtered.filter(item => item.score >= (filters.minScore as number));
    }
    if (filters.maxScore !== null) {
        filtered = filtered.filter(item => item.score <= (filters.maxScore as number));
    }
    if (filters.minRank !== null) {
        filtered = filtered.filter(item => item.rank >= (filters.minRank as number));
    }
    if (filters.maxRank !== null) {
        filtered = filtered.filter(item => item.rank <= (filters.maxRank as number));
    }

    // Apply Sorting
    // Default sort is Score Descending if nothing selected
    const sortBy = filters.sortBy || 'score';
    const sortOrder = filters.sortOrder || 'desc';

    filtered.sort((a, b) => {
        let valA: any = a[sortBy as keyof RankingItem];
        let valB: any = b[sortBy as keyof RankingItem];

        // Handle specific fields if needed, but score, rank, quota, year are all numbers
        // except year is number.

        if (typeof valA === 'string') {
            valA = valA.toLocaleLowerCase('tr-TR');
            valB = valB.toLocaleLowerCase('tr-TR');
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        } else {
            // Numbers
            if (sortOrder === 'asc') {
                return valA - valB;
            } else {
                return valB - valA;
            }
        }
    });

    // Pagination
    const limit = 20;
    const start = pageParam * limit;
    const end = start + limit;
    const pageData = filtered.slice(start, end);

    const nextCursor = end < filtered.length ? pageParam + 1 : null;

    return {
        data: pageData,
        nextCursor
    };
};

export const fetchFilterOptions = async (): Promise<FilterOptions> => {
    // Extract unique options from processedData
    const years = [2024]; // Static for now
    const scoreTypes = Array.from(new Set(processedData.map(d => d.scoreType))).sort();
    const cities = Array.from(new Set(processedData.map(d => d.city))).sort();
    const universities = Array.from(new Set(processedData.map(d => d.universityName))).sort();
    const departments = Array.from(new Set(processedData.map(d => d.departmentName))).sort();

    return {
        years,
        scoreTypes,
        cities,
        universities,
        departments
    };
};

export const fetchRankingDetails = async (id: string): Promise<RankingDetail> => {
    const item = processedData.find(d => d.id === id);
    if (!item) {
        throw new Error('Ranking not found');
    }

    // Mock history and extra details since they are not in JSON
    return {
        ...item,
        history: [
            { year: 2023, score: item.score * 0.98, rank: item.rank + 5 },
            { year: 2022, score: item.score * 0.95, rank: item.rank + 12 },
        ],
        description: `${item.universityName} - ${item.departmentName} programı.`,
        website: `https://www.${item.universityName.replace(/\s+/g, '').toLowerCase()}.edu.tr`,
    };
};
