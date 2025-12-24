import { FilterOptions, FilterState, RankingDetail, RankingItem } from '../types/ranking';
import { client } from './client';

interface FetchRankingsResponse {
    data: RankingItem[];
    nextCursor: number | null;
}

export const fetchRankings = async (
    pageParam: number = 0,
    filters: FilterState
): Promise<FetchRankingsResponse> => {
    const params = {
        cursor: pageParam,
        limit: 20,
        q: filters.searchQuery,
        year: filters.year,
        score_type: filters.scoreType,
        city: filters.city,
        university: filters.university,
        department: filters.department,
    };

    try {
        const response = await client.get('/ranks', { params });
        return response.data;
    } catch (error) {
        // Return mock data if API fails (for development/MVP without backend ready)
        console.warn('API call failed, returning mock data', error);
        return fetchMockRankings(pageParam, filters);
    }
};

export const fetchFilterOptions = async (): Promise<FilterOptions> => {
    try {
        const response = await client.get('/ranks/filters');
        return response.data;
    } catch (error) {
        console.warn('API call failed, returning mock options');
        return {
            years: [2024, 2023, 2022],
            scoreTypes: ['SAY', 'EA', 'SOZ', 'DIL'],
            cities: ['Istanbul', 'Ankara', 'Izmir'],
            universities: ['Bogazici', 'ODTU', 'ITU'],
            departments: ['Computer Engineering', 'Medicine', 'Law']
        }
    }
};

// Mock Data Generator
const fetchMockRankings = async (page: number, filters: FilterState): Promise<FetchRankingsResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    const start = page * 20;

    if (start >= 100) return { data: [], nextCursor: null }; // Limit mock data

    const mockData: RankingItem[] = Array.from({ length: 20 }).map((_, i) => ({
        id: `rank-${start + i}`,
        universityName: 'Bogazici University',
        departmentName: 'Computer Engineering',
        faculty: 'Engineering',
        scoreType: 'SAY',
        year: 2024,
        score: 550 - (start + i),
        rank: start + i + 1,
        quota: 100,
        city: 'Istanbul',
    }));

    return {
        data: mockData,
        nextCursor: page + 1,
    };
};

export const fetchRankingDetails = async (id: string): Promise<RankingDetail> => {
    try {
        const response = await client.get(`/ranks/${id}`);
        return response.data;
    } catch (error) {
        console.warn('API call failed, returning mock details', error);
        return fetchMockDetails(id);
    }
};

const fetchMockDetails = async (id: string): Promise<RankingDetail> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        id,
        universityName: 'Bogazici University',
        departmentName: 'Computer Engineering',
        faculty: 'Engineering',
        scoreType: 'SAY',
        year: 2024,
        score: 545.2,
        rank: 120,
        quota: 100,
        city: 'Istanbul',
        history: [
            { year: 2023, score: 540.1, rank: 135 },
            { year: 2022, score: 535.5, rank: 150 },
            { year: 2021, score: 530.0, rank: 160 },
        ],
        description: 'One of the top computer engineering programs in the country.',
        website: 'https://cmpe.boun.edu.tr',
        contactEmail: 'info@cmpe.boun.edu.tr'
    };
};
