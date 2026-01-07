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
            yerlesen: latestYearData.yerlesen,
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
                    yerlesen: yearData.yerlesen,
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
        } else if (filters.quotaType === 'Vakıf' || filters.quotaType === 'Vakif') {
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
    const quotaTypes = ['Devlet', 'Vakıf'];

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

/**
 * Estimates the ranking (basari siralamasi) based on a given yerleştirme puanı (placement score) and score type
 * 
 * IMPORTANT:
 * - Only compares programs with the exact same score_type (TYT with TYT, SAY with SAY, etc.)
 * - Compares yerleştirme puanı values: user's yerleştirme puanı vs program's taban_puan (which is also yerleştirme puanı)
 * - Uses only 2025 data for consistency
 * - Each exam type (TYT, SAY, EA, SÖZ, DİL) has its own ranking scale
 * 
 * @param yerlesmePuani The user's yerleştirme puanı (placement score) for the specific exam type
 * @param scoreType The score type (TYT, SAY, EA, SÖZ, DİL) - must match exactly with JSON score_type values
 * @returns Estimated ranking or null if cannot be estimated
 */
export const estimateRanking = (yerlesmePuani: number, scoreType: string): number | null => {
    if (yerlesmePuani <= 0) return null;
    if (!scoreType || scoreType.trim() === '') return null;

    // Special handling for TYT: use Y-TYT (yerleştirme puanı, OBP dahil) band chart instead of JSON data
    if (scoreType === 'TYT') {
        // Optimized anchor points from latest 2025 Y-TYT band chart (puan → hedef/gerçek sıralama):
        //  857      → 527.20   (Elit Zirve)
        //  2.878    → 513.07   (Derece Grubu)
        //  7.342    → 498.94   (Güvenli Liman)
        // 31.241    → 466.14   (Kırılma 1)
        // 73.211    → 437.87   (Yığılmanın ayak sesleri)
        // 138.261   → 409.59   (Ortalama üstü rekabet)
        // 619.647   → 321.67   (Orta Sınıf)
        // 1.694.681 → 239.72   (Rekabetin bittiği yer)
        // 1.892.918 → 225.88   (Baraj üstü son bölge)
        const anchors: { puan: number; rank: number }[] = [
            { puan: 527.20,   rank: 857 },       // Ref: 527,20 → 857 (Elit Zirve)
            { puan: 513.07,   rank: 2_878 },     // Ref: 513,07 → 2.878 (Derece Grubu)
            { puan: 498.94,   rank: 7_342 },     // Ref: 498,94 → 7.342 (Güvenli Liman)
            { puan: 466.14,   rank: 31_241 },    // Ref: 466,14 → 31.241 (Kırılma 1)
            { puan: 437.87,   rank: 73_211 },    // Ref: 437,87 → 73.211 (Yığılmanın ayak sesleri)
            { puan: 409.59,   rank: 138_261 },   // Ref: 409,59 → 138.261 (Ortalama üstü rekabet)
            { puan: 321.67,   rank: 619_647 },   // Ref: 321,67 → 619.647 (Orta Sınıf)
            { puan: 239.72,   rank: 1_694_681 }, // Ref: 239,72 → 1.694.681 (Rekabetin bittiği yer)
            { puan: 225.88,   rank: 1_892_918 }, // Ref: 225,88 → 1.892.918 (Baraj üstü son bölge)
        ];

        // Sort anchors by puan descending (higher score = better rank)
        anchors.sort((a, b) => b.puan - a.puan);

        const best = anchors[0];
        const worst = anchors[anchors.length - 1];

        // If score is higher than best anchor, extrapolate towards a better (lower) rank using the first segment
        if (yerlesmePuani >= best.puan) {
            const second = anchors[1];
            const scoreRange = best.puan - second.puan;
            const rankRange = second.rank - best.rank;
            const extra = yerlesmePuani - best.puan;

            if (scoreRange > 0) {
                const slope = rankRange / scoreRange; // rank change per 1 puan
                const est = best.rank + slope * (-extra); // higher puan → lower rank
                return Math.max(1, Math.round(est));
            }
            return best.rank;
        }

        // If score is lower than worst anchor, extrapolate towards worse (higher) rank using last segment
        if (yerlesmePuani <= worst.puan) {
            const beforeWorst = anchors[anchors.length - 2];
            const scoreRange = beforeWorst.puan - worst.puan;
            const rankRange = worst.rank - beforeWorst.rank;
            const extra = worst.puan - yerlesmePuani;

            if (scoreRange > 0) {
                const slope = rankRange / scoreRange; // rank change per 1 puan
                const est = worst.rank + slope * (extra); // lower puan → higher rank
                return Math.max(1, Math.round(est));
            }
            return worst.rank;
        }

        // Otherwise, find two neighboring anchors around the user's score and interpolate rank linearly
        for (let i = 0; i < anchors.length - 1; i++) {
            const upper = anchors[i];
            const lower = anchors[i + 1];
            if (yerlesmePuani <= upper.puan && yerlesmePuani >= lower.puan) {
                const scoreRange = upper.puan - lower.puan;
                const rankRange = lower.rank - upper.rank; // rank worsens as score decreases
                const userDelta = upper.puan - yerlesmePuani;

                if (scoreRange <= 0.0001) {
                    return upper.rank;
                }

                const ratio = userDelta / scoreRange;
                const est = upper.rank + rankRange * ratio;
                return Math.max(1, Math.round(est));
            }
        }

        // Fallback (should not hit often)
        return null;
    }

    const rawData = application as unknown as RawRankingItem[];
    
    // Filter programs by exact score_type match - this is critical for accurate ranking estimation
    // Each exam type (TYT, SAY, EA, SÖZ, DİL) has its own yerleştirme puanı scale and ranking
    // Only programs with the same score_type should be compared
    // taban_puan in the JSON is the minimum yerleştirme puanı needed to get into that program (also a yerleştirme puanı)
    const relevantPrograms: Array<{ tabanPuan: number; basariSirasi: number }> = [];
    
    rawData.forEach((item) => {
        // Strict comparison: only include programs with exact score_type match
        // This ensures TYT scores are only compared with TYT programs, SAY with SAY, etc.
        if (item.score_type !== scoreType) {
            return; // Skip programs with different score_type
        }
        
        // Always use 2025 data only - skip programs without 2025 data
        const year2025 = item.years.find(y => y.year === 2025);
        if (!year2025) {
            return; // Skip programs that don't have 2025 data
        }
        
        // Only include programs with valid 2025 taban_puan and basari_sirasi
        if (year2025.taban_puan > 0 && year2025.basari_sirasi !== null) {
            relevantPrograms.push({
                tabanPuan: year2025.taban_puan,
                basariSirasi: year2025.basari_sirasi,
            });
        }
    });

    // Validate that we have programs with matching score_type
    if (relevantPrograms.length === 0) {
        // No programs found with the specified score_type - this could indicate:
        // 1. Invalid score_type parameter
        // 2. No data available for this score_type
        return null;
    }

    // Sort by taban_puan (yerleştirme puanı) descending (higher scores = better ranks)
    // All programs in this array have been filtered to match the exact score_type
    // This ensures TYT yerleştirme puanı is only compared with TYT taban_puan, SAY with SAY, etc.
    relevantPrograms.sort((a, b) => b.tabanPuan - a.tabanPuan);

    // First, check if there's a program with taban_puan very close to user's yerleştirme puanı
    // If found and close enough, return that program's basari_sirasi directly
    const closeMatchThreshold = 0.5; // Consider it a match if within 0.5 points
    let closestMatch: { tabanPuan: number; basariSirasi: number; diff: number } | null = null;
    
    for (const program of relevantPrograms) {
        const diff = Math.abs(program.tabanPuan - yerlesmePuani);
        if (diff <= closeMatchThreshold) {
            // If this is the first match or closer than previous match, use it
            if (!closestMatch || diff < closestMatch.diff) {
                closestMatch = { tabanPuan: program.tabanPuan, basariSirasi: program.basariSirasi, diff };
            }
        }
    }
    
    // If we found a close match, return its basari_sirasi directly
    if (closestMatch) {
        return closestMatch.basariSirasi;
    }

    // If no close match found, proceed with interpolation
    // Find the closest programs to the user's yerleştirme puanı for interpolation
    // We're comparing yerleştirme puanı values: user's yerleştirme puanı vs program's taban_puan (yerleştirme puanı)
    // closestLower: program with highest taban_puan (yerleştirme puanı) that is <= user's yerleştirme puanı (user can get into this)
    // closestHigher: program with lowest taban_puan (yerleştirme puanı) that is > user's yerleştirme puanı (user cannot get into this)
    let closestLower: { tabanPuan: number; basariSirasi: number } | null = null;
    let closestHigher: { tabanPuan: number; basariSirasi: number } | null = null;

    for (const program of relevantPrograms) {
        // Compare yerleştirme puanı values: user's yerleştirme puanı vs program's taban_puan (yerleştirme puanı)
        if (program.tabanPuan <= yerlesmePuani) {
            // User's yerleştirme puanı is >= this program's taban_puan (yerleştirme puanı), so they can get in
            // We want the highest taban_puan (yerleştirme puanı) that user can still get into
            if (!closestLower || program.tabanPuan > closestLower.tabanPuan) {
                closestLower = { tabanPuan: program.tabanPuan, basariSirasi: program.basariSirasi };
            }
        } else {
            // User's yerleştirme puanı is < this program's taban_puan (yerleştirme puanı), so they cannot get in
            // We want the lowest taban_puan (yerleştirme puanı) that user cannot get into
            if (!closestHigher || program.tabanPuan < closestHigher.tabanPuan) {
                closestHigher = { tabanPuan: program.tabanPuan, basariSirasi: program.basariSirasi };
            }
        }
    }

    // If we have both lower and higher bounds, interpolate between them for accurate ranking
    // This ensures the ranking changes dynamically as the yerleştirme puanı changes
    if (closestLower && closestHigher) {
        const scoreDiff = closestHigher.tabanPuan - closestLower.tabanPuan; // Difference in yerleştirme puanı
        const rankDiff = closestHigher.basariSirasi - closestLower.basariSirasi;
        const userScoreDiff = yerlesmePuani - closestLower.tabanPuan; // User's yerleştirme puanı difference
        
        if (Math.abs(scoreDiff) > 0.001) {
            // Linear interpolation: higher yerleştirme puanı = better (lower) rank
            // Since ranks are in ascending order (1 is best, higher number is worse)
            // and yerleştirme puanı values are in descending order (higher score is better)
            // we interpolate: rank = lowerRank + (rankDiff * (userScoreDiff / scoreDiff))
            const estimatedRank = closestLower.basariSirasi + (rankDiff * (userScoreDiff / scoreDiff));
            return Math.max(1, Math.round(estimatedRank));
        } else {
            // If scores are very close, use the average rank
            return Math.round((closestLower.basariSirasi + closestHigher.basariSirasi) / 2);
        }
    }

    // If we only have a lower bound (user's score is very high), cap at the best available rank
    // This avoids over-optimistic extrapolation when there is no data beyond the highest taban_puan (e.g. TYT > 443)
    if (closestLower && !closestHigher) {
        // Best (minimum) basariSirasi among all programs for this scoreType
        const bestProgram = relevantPrograms.reduce((best, p) =>
            p.basariSirasi < best.basariSirasi ? p : best
        , relevantPrograms[0]);

        return bestProgram.basariSirasi;
    }

    // If we only have a higher bound (user's score is very low), estimate based on score difference
    if (closestHigher) {
        // Find the next program with higher taban_puan to estimate ranking trend
        const programsWithHigherScore = relevantPrograms.filter(p => p.tabanPuan > closestHigher!.tabanPuan);
        if (programsWithHigherScore.length > 0) {
            // Get the program with the lowest score among those with higher scores
            const nextHigher = programsWithHigherScore.reduce((min, p) => p.tabanPuan < min.tabanPuan ? p : min);
            const scoreDiff = nextHigher.tabanPuan - closestHigher.tabanPuan;
            const rankDiff = nextHigher.basariSirasi - closestHigher.basariSirasi;
            const userScoreDiff = closestHigher.tabanPuan - yerlesmePuani;
            
            if (Math.abs(scoreDiff) > 0.001) {
                // Extrapolate: user has lower score than closestHigher, so worse (higher) rank
                // Lower score means higher rank, so we add
                const estimatedRank = closestHigher.basariSirasi + (rankDiff * (userScoreDiff / scoreDiff));
                return Math.max(1, Math.round(estimatedRank));
            }
        }
        return closestHigher.basariSirasi;
    }

    return null;
};
