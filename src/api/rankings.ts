import { FilterOptions, FilterState, RankingDetail, RankingItem } from '../types/ranking';
import { YKSCalculation } from '../store/userStore';
import { executeQuery, executeQuerySingle } from '../db/database';

// Database row interfaces
interface ProgramRow {
    program_id: number;
    university_id: number;
    university_name: string;
    location_city: string;
    campus: string | null;
    university_type: string;
    faculty: string;
    program_name: string;
    language: string | null;
    duration_years: number;
    score_type: string;
    quota_type: string | null;
}

interface YearRow {
    program_id: number;
    year: number;
    kontenjan: number;
    yerlesen: number;
    taban_puan: number;
    basari_sirasi: number | null;
    status: string;
}

interface RankingRow extends ProgramRow, YearRow {}

// Helper function to create SQL expression that normalizes Turkish characters for case-insensitive comparison
// SQLite's LOWER() doesn't handle Turkish characters (İ, ı, Ş, ş, Ğ, ğ, etc.)
// This function creates a SQL expression that replaces Turkish characters before using LOWER()
const normalizeTurkishForSQL = (column: string): string => {
    // Replace Turkish uppercase characters with their lowercase equivalents before LOWER()
    // İ -> i, I -> ı, Ş -> ş, Ğ -> ğ, Ç -> ç, Ö -> ö, Ü -> ü
    return `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, 'İ', 'i'), 'I', 'ı'), 'Ş', 'ş'), 'Ğ', 'ğ'), 'Ç', 'ç'), 'Ö', 'ö'), 'Ü', 'ü'))`;
};

// Helper function to normalize search query text for Turkish characters
const normalizeSearchQuery = (text: string): string => {
    return text
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ş/g, 'ş')
        .replace(/Ğ/g, 'ğ')
        .replace(/Ç/g, 'ç')
        .replace(/Ö/g, 'ö')
        .replace(/Ü/g, 'ü')
        .toLocaleLowerCase('tr-TR');
};

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

// Helper function to convert database row to RankingItem
const rowToRankingItem = (row: RankingRow): RankingItem => ({
    id: row.program_id.toString(),
    universityName: row.university_name,
    departmentName: row.program_name,
    faculty: row.faculty,
    scoreType: row.score_type,
    year: row.year,
    score: row.taban_puan,
    rank: row.basari_sirasi,
    quota: row.kontenjan,
    yerlesen: row.yerlesen,
    city: row.location_city,
    language: row.language,
    quotaType: row.quota_type,
    durationYears: row.duration_years,
});

export const fetchRankings = async (
    pageParam: number = 0,
    filters: FilterState,
    yksCalculation?: YKSCalculation | null
): Promise<FetchRankingsResponse> => {
    // Build SQL query with filters
    // ---------------------------------------------------------
    // Database schema:
    // - programs table: contains university_name, location_city, university_type directly
    // - yearly_stats table: contains year, kontenjan, yerlesen, taban_puan, basari_sirasi, status
    // ---------------------------------------------------------
    let query = `
        SELECT 
            p.program_id,
            p.university_id,
            p.university_name,
            p.location_city,
            NULL AS campus,
            p.university_type,
            p.faculty,
            p.program_name,
            p.language,
            p.duration_years,
            p.score_type,
            p.quota_type,
            ys.year,
            ys.kontenjan,
            ys.yerlesen,
            ys.taban_puan,
            ys.basari_sirasi,
            ys.status
        FROM programs p
        INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
        WHERE ys.taban_puan > 0
    `;

    const params: any[] = [];

    // Year filter
    if (filters.year !== null) {
        query += ` AND ys.year = ?`;
        params.push(filters.year);
    } else {
        // Use 2025 if available, otherwise most recent year per program
        query = `
            SELECT 
                p.program_id,
                p.university_id,
                p.university_name,
                p.location_city,
                NULL AS campus,
                p.university_type,
                p.faculty,
                p.program_name,
                p.language,
                p.duration_years,
                p.score_type,
                p.quota_type,
                ys.year,
                ys.kontenjan,
                ys.yerlesen,
                ys.taban_puan,
                ys.basari_sirasi,
                ys.status
            FROM programs p
            INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
            INNER JOIN (
                SELECT 
                    program_id,
                    COALESCE(
                        MAX(CASE WHEN year = 2025 THEN year END),
                        MAX(year)
                    ) as best_year
                FROM yearly_stats
                WHERE taban_puan > 0
                GROUP BY program_id
            ) best_years ON ys.program_id = best_years.program_id AND ys.year = best_years.best_year
            WHERE ys.taban_puan > 0
        `;
    }

    // Search query filter (moved to SQL for better performance)
    // Searches only in university_name and program_name
    // Must be applied AFTER year filter to work correctly
    if (filters.searchQuery && filters.searchQuery.trim()) {
        const normalizedQuery = normalizeSearchQuery(filters.searchQuery.trim());
        const searchPattern = `%${normalizedQuery}%`;
        query += ` AND (
            ${normalizeTurkishForSQL('p.university_name')} LIKE ? OR 
            ${normalizeTurkishForSQL('p.program_name')} LIKE ?
        )`;
        params.push(searchPattern, searchPattern);
    }

    // Score type filter
    if (filters.scoreType) {
        query += ` AND p.score_type = ?`;
        params.push(filters.scoreType);
    }

    // City filter (Using p.location_city)
    if (filters.city) {
        const cityPattern = `%${filters.city.toLocaleLowerCase('tr-TR')}%`;
        query += ` AND ${normalizeTurkishForSQL('p.location_city')} LIKE ?`;
        params.push(cityPattern);
    }

    // University filter (Using p.university_name)
    if (filters.university) {
        const universityPattern = `%${filters.university.toLocaleLowerCase('tr-TR')}%`;
        query += ` AND ${normalizeTurkishForSQL('p.university_name')} LIKE ?`;
        params.push(universityPattern);
    }

    // Department filter
    if (filters.department) {
        const deptFilter = filters.department.toLocaleLowerCase('tr-TR');
        if (filters.department === 'Mühendislik' || filters.department.toLowerCase() === 'mühendislik') {
            query += ` AND (${normalizeTurkishForSQL('p.program_name')} LIKE ? OR ${normalizeTurkishForSQL('p.program_name')} LIKE ?)`;
            params.push(`%${deptFilter}%`, '%mühendisliği%');
        } else {
            query += ` AND ${normalizeTurkishForSQL('p.program_name')} LIKE ?`;
            params.push(`%${deptFilter}%`);
        }
    }

    // Quota type filter
    if (filters.quotaType) {
        if (filters.quotaType === 'Devlet') {
            query += ` AND p.quota_type IS NULL`;
        } else if (filters.quotaType === 'Vakıf' || filters.quotaType === 'Vakif') {
            query += ` AND p.quota_type IS NOT NULL`;
        }
    }

    // Language filter
    if (filters.language && filters.language.length > 0) {
        const hasTurkce = filters.language.includes('Türkçe');
        const otherLanguages = filters.language.filter((l: string) => l !== 'Türkçe');
        
        if (hasTurkce && otherLanguages.length > 0) {
            query += ` AND (p.language IS NULL OR p.language IN (${otherLanguages.map(() => '?').join(',')}))`;
            params.push(...otherLanguages);
        } else if (hasTurkce) {
            query += ` AND p.language IS NULL`;
        } else {
            query += ` AND p.language IN (${otherLanguages.map(() => '?').join(',')})`;
            params.push(...otherLanguages);
        }
    }

    // Score range filters (Using ys.taban_puan)
    if (filters.minScore !== null) {
        query += ` AND ys.taban_puan >= ?`;
        params.push(filters.minScore);
    }
    if (filters.maxScore !== null) {
        query += ` AND ys.taban_puan <= ?`;
        params.push(filters.maxScore);
    }

    // Rank range filters (Using ys.basari_sirasi)
    if (filters.minRank !== null) {
        query += ` AND ys.basari_sirasi >= ?`;
        params.push(filters.minRank);
    }
    if (filters.maxRank !== null) {
        query += ` AND ys.basari_sirasi <= ?`;
        params.push(filters.maxRank);
    }

    // YKS Calculation Filtering
    if (yksCalculation) {
        const scoreTypeMap: Record<string, { score: number; scoreType: string }> = {
            'TYT': { score: yksCalculation.tytYerlesme, scoreType: 'TYT' },
            'SAY': { score: yksCalculation.sayYerlesme, scoreType: 'SAY' },
            'EA': { score: yksCalculation.eaYerlesme, scoreType: 'EA' },
            'SÖZ': { score: yksCalculation.sozYerlesme, scoreType: 'SÖZ' },
        };

        const availableScores = Object.entries(scoreTypeMap)
            .filter(([_, data]) => data.score > 0);

        if (availableScores.length > 0) {
            const scoreConditions = availableScores.map(([_, data]) => {
                params.push(data.scoreType, data.score);
                return `(p.score_type = ? AND ys.taban_puan <= ?)`;
            });
            query += ` AND (${scoreConditions.join(' OR ')})`;
        }
    }

    // Apply Sorting
    const sortBy = filters.sortBy || 'score';
    const sortOrder = filters.sortOrder || 'desc';
    
    let orderBy = '';
    switch (sortBy) {
        case 'score':
            orderBy = `ys.taban_puan ${sortOrder.toUpperCase()}`;
            break;
        case 'rank':
            orderBy = `CASE WHEN ys.basari_sirasi IS NULL THEN 1 ELSE 0 END, ys.basari_sirasi ${sortOrder.toUpperCase()}`;
            break;
        case 'quota':
            orderBy = `ys.kontenjan ${sortOrder.toUpperCase()}`;
            break;
        case 'year':
            orderBy = `ys.year ${sortOrder.toUpperCase()}`;
            break;
        default:
            orderBy = `ys.taban_puan DESC`;
    }
    query += ` ORDER BY ${orderBy}`;

    // Execute query to get matching rows (search is now done in SQL)
    const rows = await executeQuery<RankingRow>(query, params);
    
    // Convert to RankingItem
    const allItems = rows.map(rowToRankingItem);

    // Pagination (now done on already filtered results)
    const limit = 20;
    const start = pageParam * limit;
    const end = start + limit;
    const pageData = allItems.slice(start, end);

    const nextCursor = end < allItems.length ? pageParam + 1 : null;

    return {
        data: pageData,
        nextCursor
    };
};

export const fetchFilterOptions = async (): Promise<FilterOptions> => {
    // Query unique years from yearly_stats
    const yearRows = await executeQuery<{ year: number }>(
        `SELECT DISTINCT year FROM yearly_stats WHERE taban_puan > 0 ORDER BY year DESC`
    );
    const years = yearRows.map((row: { year: number }) => row.year);

    // Query unique score types
    const scoreTypeRows = await executeQuery<{ score_type: string }>(
        `SELECT DISTINCT score_type FROM programs ORDER BY score_type`
    );
    const scoreTypes = scoreTypeRows.map((row: { score_type: string }) => row.score_type);

    // Query unique cities from programs table
    const cityRows = await executeQuery<{ location_city: string }>(
        `SELECT DISTINCT location_city FROM programs WHERE location_city IS NOT NULL AND location_city != '' ORDER BY location_city`
    );
    const cities = cityRows.map((row: { location_city: string }) => row.location_city);

    // Query unique universities from programs table
    const universityRows = await executeQuery<{ university_name: string }>(
        `SELECT DISTINCT university_name FROM programs WHERE university_name IS NOT NULL AND university_name != '' ORDER BY university_name`
    );
    const universities = universityRows.map((row: { university_name: string }) => row.university_name);

    // Query unique departments
    const departmentRows = await executeQuery<{ program_name: string }>(
        `SELECT DISTINCT program_name FROM programs ORDER BY program_name`
    );
    const departments = departmentRows.map((row: { program_name: string }) => row.program_name);

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
    const programId = parseInt(id, 10);
    if (isNaN(programId)) {
        throw new Error('Invalid program ID');
    }

    // Get program info with latest year data
    const programQuery = `
        SELECT 
            p.program_id,
            p.university_id,
            p.university_name,
            p.location_city,
            NULL AS campus,
            p.university_type,
            p.faculty,
            p.program_name,
            p.language,
            p.duration_years,
            p.score_type,
            p.quota_type,
            ys.year,
            ys.kontenjan,
            ys.yerlesen,
            ys.taban_puan,
            ys.basari_sirasi,
            ys.status
        FROM programs p
        INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
        INNER JOIN (
            SELECT 
                program_id,
                COALESCE(
                    MAX(CASE WHEN year = 2025 THEN year END),
                    MAX(year)
                ) as best_year
            FROM yearly_stats
            WHERE program_id = ? AND taban_puan > 0
            GROUP BY program_id
        ) best_years ON ys.program_id = best_years.program_id AND ys.year = best_years.best_year
        WHERE p.program_id = ? AND ys.taban_puan > 0
    `;

    const programRow = await executeQuerySingle<RankingRow>(programQuery, [programId, programId]);
    
    if (!programRow) {
        throw new Error('Ranking not found');
    }

    const item = rowToRankingItem(programRow);

    // Get all years for history
    const historyRows = await executeQuery<YearRow>(
        `SELECT 
            program_id,
            year, 
            kontenjan, 
            yerlesen, 
            taban_puan, 
            basari_sirasi, 
            status 
         FROM yearly_stats 
         WHERE program_id = ? AND taban_puan > 0 
         ORDER BY year DESC`,
        [programId]
    );

    const history = historyRows.map((yearData: YearRow) => ({
        year: yearData.year,
        score: yearData.taban_puan,
        rank: yearData.basari_sirasi,
        yerlesen: yearData.yerlesen,
        kontenjan: yearData.kontenjan,
    }));

    return {
        ...item,
        history,
        description: `${item.universityName} - ${item.departmentName} programı.`,
        website: `https://www.${item.universityName.replace(/\s+/g, '').toLowerCase()}.edu.tr`,
    };
};

/**
 * Estimates the ranking (basari siralamasi) based on a given yerleştirme puanı
 */
export const estimateRanking = async (yerlesmePuani: number, scoreType: string): Promise<number | null> => {
    if (yerlesmePuani <= 0) return null;
    if (!scoreType || scoreType.trim() === '') return null;

    // Special handling for TYT (This logic remains unchanged as it's hardcoded)
    if (scoreType === 'TYT') {
        const anchors: { puan: number; rank: number }[] = [
            { puan: 527.20,   rank: 857 },
            { puan: 513.07,   rank: 2_878 },
            { puan: 498.94,   rank: 7_342 },
            { puan: 466.14,   rank: 31_241 },
            { puan: 437.87,   rank: 73_211 },
            { puan: 409.59,   rank: 138_261 },
            { puan: 321.67,   rank: 619_647 },
            { puan: 239.72,   rank: 1_694_681 },
            { puan: 225.88,   rank: 1_892_918 },
        ];

        anchors.sort((a, b) => b.puan - a.puan);
        const best = anchors[0];
        const worst = anchors[anchors.length - 1];

        if (yerlesmePuani >= best.puan) {
            const second = anchors[1];
            const scoreRange = best.puan - second.puan;
            const rankRange = second.rank - best.rank;
            const extra = yerlesmePuani - best.puan;
            if (scoreRange > 0) {
                const slope = rankRange / scoreRange;
                const est = best.rank + slope * (-extra);
                return Math.max(1, Math.round(est));
            }
            return best.rank;
        }

        if (yerlesmePuani <= worst.puan) {
            const beforeWorst = anchors[anchors.length - 2];
            const scoreRange = beforeWorst.puan - worst.puan;
            const rankRange = worst.rank - beforeWorst.rank;
            const extra = worst.puan - yerlesmePuani;
            if (scoreRange > 0) {
                const slope = rankRange / scoreRange;
                const est = worst.rank + slope * (extra);
                return Math.max(1, Math.round(est));
            }
            return worst.rank;
        }

        for (let i = 0; i < anchors.length - 1; i++) {
            const upper = anchors[i];
            const lower = anchors[i + 1];
            if (yerlesmePuani <= upper.puan && yerlesmePuani >= lower.puan) {
                const scoreRange = upper.puan - lower.puan;
                const rankRange = lower.rank - upper.rank;
                const userDelta = upper.puan - yerlesmePuani;
                if (scoreRange <= 0.0001) return upper.rank;
                const ratio = userDelta / scoreRange;
                const est = upper.rank + rankRange * ratio;
                return Math.max(1, Math.round(est));
            }
        }
        return null;
    }

    // UPDATED QUERY: Use 'yearly_stats' table with Turkish column names
    const relevantProgramsRows = await executeQuery<{ taban_puan: number; basari_sirasi: number }>(
        `SELECT ys.taban_puan, ys.basari_sirasi
         FROM programs p
         INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
         WHERE p.score_type = ? 
           AND ys.year = 2025
           AND ys.taban_puan > 0
           AND ys.basari_sirasi IS NOT NULL`,
        [scoreType]
    );

    const relevantPrograms: Array<{ tabanPuan: number; basariSirasi: number }> = relevantProgramsRows.map((row: { taban_puan: number; basari_sirasi: number }) => ({
        tabanPuan: row.taban_puan,
        basariSirasi: row.basari_sirasi,
    }));

    if (relevantPrograms.length === 0) {
        return null;
    }

    relevantPrograms.sort((a, b) => b.tabanPuan - a.tabanPuan);

    const closeMatchThreshold = 0.5;
    let closestMatch: { tabanPuan: number; basariSirasi: number; diff: number } | null = null;
    
    for (const program of relevantPrograms) {
        const diff = Math.abs(program.tabanPuan - yerlesmePuani);
        if (diff <= closeMatchThreshold) {
            if (!closestMatch || diff < closestMatch.diff) {
                closestMatch = { tabanPuan: program.tabanPuan, basariSirasi: program.basariSirasi, diff };
            }
        }
    }
    
    if (closestMatch) {
        return closestMatch.basariSirasi;
    }

    let closestLower: { tabanPuan: number; basariSirasi: number } | null = null;
    let closestHigher: { tabanPuan: number; basariSirasi: number } | null = null;

    for (const program of relevantPrograms) {
        if (program.tabanPuan <= yerlesmePuani) {
            if (!closestLower || program.tabanPuan > closestLower.tabanPuan) {
                closestLower = { tabanPuan: program.tabanPuan, basariSirasi: program.basariSirasi };
            }
        } else {
            if (!closestHigher || program.tabanPuan < closestHigher.tabanPuan) {
                closestHigher = { tabanPuan: program.tabanPuan, basariSirasi: program.basariSirasi };
            }
        }
    }

    if (closestLower && closestHigher) {
        const scoreDiff = closestHigher.tabanPuan - closestLower.tabanPuan;
        const rankDiff = closestHigher.basariSirasi - closestLower.basariSirasi;
        const userScoreDiff = yerlesmePuani - closestLower.tabanPuan;
        
        if (Math.abs(scoreDiff) > 0.001) {
            const estimatedRank = closestLower.basariSirasi + (rankDiff * (userScoreDiff / scoreDiff));
            return Math.max(1, Math.round(estimatedRank));
        } else {
            return Math.round((closestLower.basariSirasi + closestHigher.basariSirasi) / 2);
        }
    }

    if (closestLower && !closestHigher) {
        const bestProgram = relevantPrograms.reduce((best, p) =>
            p.basariSirasi < best.basariSirasi ? p : best
        , relevantPrograms[0]);
        return bestProgram.basariSirasi;
    }

    if (closestHigher) {
        const programsWithHigherScore = relevantPrograms.filter(p => p.tabanPuan > closestHigher!.tabanPuan);
        if (programsWithHigherScore.length > 0) {
            const nextHigher = programsWithHigherScore.reduce((min, p) => p.tabanPuan < min.tabanPuan ? p : min);
            const scoreDiff = nextHigher.tabanPuan - closestHigher.tabanPuan;
            const rankDiff = nextHigher.basariSirasi - closestHigher.basariSirasi;
            const userScoreDiff = closestHigher.tabanPuan - yerlesmePuani;
            
            if (Math.abs(scoreDiff) > 0.001) {
                const estimatedRank = closestHigher.basariSirasi + (rankDiff * (userScoreDiff / scoreDiff));
                return Math.max(1, Math.round(estimatedRank));
            }
        }
        return closestHigher.basariSirasi;
    }

    return null;
};