import application from '../../outputjson.json';
import { FilterOptions, FilterState, RankingDetail, RankingItem } from '../types/ranking';
import { YKSCalculation } from '../store/userStore';

// Define the shape of the raw JSON item
interface YearData {
    year: number;
    kontenjan: number;
    yerlesen: number;
    taban_puan: number;
    basari_sirasi: number | null;
    status: string;
}

interface RawRankingItem {
    university_id: number;
    university_name: string;
    location_city: string;
    campus: string | null;
    university_type: string;
    faculty: string;
    program_id: number;
    program_name: string;
    language: string;
    duration_years: number;
    score_type: string;
    quota_type: string | null;
    years: YearData[];
}

// 1. Pre-process data: Parse and Normalize
// Create one RankingItem per program-year combination, using 2025 data if available, otherwise most recent year
const processedData: RankingItem[] = (application as unknown as RawRankingItem[])
    .flatMap((item) => {
        // Prioritize 2025, then get the most recent year data
        const year2025 = item.years.find(y => y.year === 2025);
        const latestYearData = year2025 || [...item.years].sort((a, b) => b.year - a.year)[0];
        
        if (!latestYearData || !latestYearData.taban_puan || latestYearData.taban_puan <= 0) {
            return [];
        }

        return {
            id: item.program_id.toString(),
            universityName: item.university_name,
            departmentName: item.program_name,
            faculty: item.faculty,
            scoreType: item.score_type,
            year: latestYearData.year,
            score: latestYearData.taban_puan,
            rank: latestYearData.basari_sirasi, // Use basari_sirasi from the year data
            quota: latestYearData.kontenjan,
            city: item.location_city,
            language: item.language || null,
            quotaType: item.quota_type || null,
            durationYears: item.duration_years,
        };
    })
    .filter(item => item.score > 0); // Remove items without valid score

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
    filters: FilterState,
    yksCalculation?: YKSCalculation | null
): Promise<FetchRankingsResponse> => {
    // Simulate network delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = processedData;

    // If year filter is specified, we need to process data for that specific year
    if (filters.year !== null) {
        const rawData = application as unknown as RawRankingItem[];
        const yearFilteredData: RankingItem[] = rawData
            .flatMap((item) => {
                // Find the year data for the specified year
                const yearData = item.years.find(y => y.year === filters.year);
                
                if (!yearData || !yearData.taban_puan || yearData.taban_puan <= 0) {
                    return [];
                }

                return {
                    id: item.program_id.toString(),
                    universityName: item.university_name,
                    departmentName: item.program_name,
                    faculty: item.faculty,
                    scoreType: item.score_type,
                    year: yearData.year,
                    score: yearData.taban_puan,
                    rank: yearData.basari_sirasi, // Use basari_sirasi from the year data
                    quota: yearData.kontenjan,
                    city: item.location_city,
                    language: item.language || null,
                    quotaType: item.quota_type || null,
                    durationYears: item.duration_years,
                };
            })
            .filter(item => item.score > 0);

        filtered = yearFilteredData;
    }
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
        // Special case: "Mühendislik" should also match "Muhendisligi"
        if (filters.department === 'Mühendislik') {
            filtered = filtered.filter(item => {
                const deptName = item.departmentName.toLocaleLowerCase('tr-TR');
                return deptName.includes(deptFilter) || deptName.includes('mühendisliği');
            });
        } else {
            filtered = filtered.filter(item => item.departmentName.toLocaleLowerCase('tr-TR').includes(deptFilter));
        }
    }
    if (filters.quotaType) {
        if (filters.quotaType === 'Devlet') {
            filtered = filtered.filter(item => item.quotaType === null);
        } else if (filters.quotaType === 'Vakif') {
            filtered = filtered.filter(item => item.quotaType !== null);
        }
    }
    if (filters.language && filters.language.length > 0) {
        filtered = filtered.filter(item => {
            // If language is null in data, it means Türkçe
            // Check if Türkçe is selected and item language is null, or if item language matches selected languages
            const isTurkce = item.language === null && filters.language!.includes('Türkçe');
            const matchesOtherLanguage = item.language !== null && filters.language!.includes(item.language);
            return isTurkce || matchesOtherLanguage;
        });
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
        filtered = filtered.filter(item => item.rank !== null && item.rank >= (filters.minRank as number));
    }
    if (filters.maxRank !== null) {
        filtered = filtered.filter(item => item.rank !== null && item.rank <= (filters.maxRank as number));
    }

    // YKS Calculation Filtering
    if (yksCalculation) {
        // Filter by all score types where user has a score and can win
        const scoreTypeMap: Record<string, { score: number; scoreType: string }> = {
            'TYT': { score: yksCalculation.tytYerlesme, scoreType: 'TYT' },
            'SAY': { score: yksCalculation.sayYerlesme, scoreType: 'SAY' },
            'EA': { score: yksCalculation.eaYerlesme, scoreType: 'EA' },
            'SÖZ': { score: yksCalculation.sozYerlesme, scoreType: 'SÖZ' },
        };

        // Get all score types where user has a valid score (> 0)
        const availableScores = Object.entries(scoreTypeMap)
            .filter(([_, data]) => data.score > 0);

        if (availableScores.length > 0) {
            // Filter to show universities in any category where user can win
            filtered = filtered.filter(item => {
                const userScoreData = availableScores.find(([_, data]) => data.scoreType === item.scoreType);
                if (!userScoreData) return false;
                
                // Show only universities where user's score >= university's score
                return userScoreData[1].score >= item.score;
            });
        }
    }

    // Apply Sorting
    // Default sort is Score Descending if nothing selected
    const sortBy = filters.sortBy || 'score';
    const sortOrder = filters.sortOrder || 'desc';

    filtered.sort((a, b) => {
        let valA: any = a[sortBy as keyof RankingItem];
        let valB: any = b[sortBy as keyof RankingItem];

        // Handle null values - place them at the end
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1; // null goes to end
        if (valB === null) return -1; // null goes to end

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
    // Extract unique options from processedData and raw data
    const rawData = application as unknown as RawRankingItem[];
    
    // Extract all unique years from all programs
    const allYears = new Set<number>();
    rawData.forEach(item => {
        item.years.forEach(yearData => allYears.add(yearData.year));
    });
    const years = Array.from(allYears).sort((a, b) => b - a);
    
    const scoreTypes = Array.from(new Set(processedData.map(d => d.scoreType))).sort();
    const cities = Array.from(new Set(processedData.map(d => d.city))).sort();
    const universities = Array.from(new Set(processedData.map(d => d.universityName))).sort();
    const departments = Array.from(new Set(processedData.map(d => d.departmentName))).sort();
    const quotaTypes = ['Devlet', 'Vakif'];

    return {
        years,
        scoreTypes,
        cities,
        universities,
        departments,
        quotaTypes
    };
};

export const fetchRankingDetails = async (id: string): Promise<RankingDetail> => {
    const item = processedData.find(d => d.id === id);
    if (!item) {
        throw new Error('Ranking not found');
    }

    // Find the raw data item to get history
    const rawData = application as unknown as RawRankingItem[];
    const rawItem = rawData.find(d => d.program_id.toString() === id);
    
    // Build history from years array, sorted by year descending
    const history = rawItem 
        ? rawItem.years
            .sort((a, b) => b.year - a.year)
            .map(yearData => ({
                year: yearData.year,
                score: yearData.taban_puan,
                rank: yearData.basari_sirasi,
                yerlesen: yearData.yerlesen,
                kontenjan: yearData.kontenjan,
            }))
        : [];

    return {
        ...item,
        history,
        description: `${item.universityName} - ${item.departmentName} programı.`,
        website: `https://www.${item.universityName.replace(/\s+/g, '').toLowerCase()}.edu.tr`,
    };
};
