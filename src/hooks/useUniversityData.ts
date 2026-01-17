import { useState, useCallback, useEffect } from 'react';
import { getDatabase } from '@/src/db/database';
import { Program, YearlyStat, ProgramWithStats } from '@/src/types/ranking';
import * as SQLite from 'expo-sqlite';

interface SearchOptions {
    query?: string;
    city?: string;
    scoreType?: string;
    faculty?: string;
    universityName?: string;
    year?: number;
    minScore?: number;
    maxScore?: number;
    minRank?: number;
    maxRank?: number;
    limit?: number;
    offset?: number;
}

interface SearchResult {
    programs: ProgramWithStats[];
    total: number;
}

/**
 * Custom hook for accessing university/program data from the database
 */
export const useUniversityData = () => {
    const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Initialize database connection
    useEffect(() => {
        let mounted = true;

        const initDatabase = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const database = await getDatabase();
                if (mounted) {
                    setDb(database);
                    setIsLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    const error = err instanceof Error ? err : new Error('Failed to initialize database');
                    setError(error);
                    setIsLoading(false);
                }
            }
        };

        initDatabase();

        return () => {
            mounted = false;
        };
    }, []);

    /**
     * Search programs with optional filters
     * Returns programs with their latest yearly stats (defaults to 2025)
     */
    const searchPrograms = useCallback(
        async (options: SearchOptions = {}): Promise<SearchResult> => {
            if (!db) {
                throw new Error('Database not initialized');
            }

            try {
                const {
                    query = '',
                    city,
                    scoreType,
                    faculty,
                    universityName,
                    year = 2025,
                    minScore,
                    maxScore,
                    minRank,
                    maxRank,
                    limit = 50,
                    offset = 0,
                } = options;

                // Build WHERE clause conditions
                const conditions: string[] = [];
                const params: any[] = [];

                // Year filter (for yearly_stats)
                conditions.push('ys.year = ?');
                params.push(year);

                // Search query (searches in university_name, program_name, faculty)
                if (query.trim()) {
                    conditions.push(
                        '(p.university_name LIKE ? OR p.program_name LIKE ? OR p.faculty LIKE ?)'
                    );
                    const searchPattern = `%${query.trim()}%`;
                    params.push(searchPattern, searchPattern, searchPattern);
                }

                // City filter
                if (city) {
                    conditions.push('p.city = ?');
                    params.push(city);
                }

                // Score type filter
                if (scoreType) {
                    conditions.push('p.score_type = ?');
                    params.push(scoreType);
                }

                // Faculty filter
                if (faculty) {
                    conditions.push('p.faculty LIKE ?');
                    params.push(`%${faculty}%`);
                }

                // University name filter
                if (universityName) {
                    conditions.push('p.university_name LIKE ?');
                    params.push(`%${universityName}%`);
                }

                // Min/Max score filters
                if (minScore !== undefined) {
                    conditions.push('ys.min_score >= ?');
                    params.push(minScore);
                }
                if (maxScore !== undefined) {
                    conditions.push('ys.min_score <= ?');
                    params.push(maxScore);
                }

                // Min/Max rank filters
                if (minRank !== undefined) {
                    conditions.push('ys.rank >= ?');
                    params.push(minRank);
                }
                if (maxRank !== undefined) {
                    conditions.push('ys.rank <= ?');
                    params.push(maxRank);
                }

                const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

                // Main query: JOIN programs with yearly_stats for the specified year
                // This is the sample SQL query that JOINs the two tables for 2025
                const searchQuery = `
                    SELECT 
                        p.program_id,
                        p.university_name,
                        p.city,
                        p.faculty,
                        p.program_name,
                        p.score_type,
                        ys.year,
                        ys.min_score,
                        ys.rank,
                        ys.quota
                    FROM programs p
                    INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
                    ${whereClause}
                    ORDER BY p.university_name, p.program_name
                    LIMIT ? OFFSET ?
                `;

                // Count query for total results
                const countQuery = `
                    SELECT COUNT(*) as total
                    FROM programs p
                    INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
                    ${whereClause}
                `;

                // Execute queries
                const [programs, countResult] = await Promise.all([
                    db.getAllAsync<ProgramWithStats>(searchQuery, [...params, limit, offset]),
                    db.getFirstAsync<{ total: number }>(countQuery, params),
                ]);

                return {
                    programs,
                    total: countResult?.total || 0,
                };
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to search programs');
                console.error('Error searching programs:', error);
                throw error;
            }
        },
        [db]
    );

    /**
     * Get a single program by ID with its stats for a specific year
     */
    const getProgramById = useCallback(
        async (programId: number, year: number = 2025): Promise<ProgramWithStats | null> => {
            if (!db) {
                throw new Error('Database not initialized');
            }

            try {
                const query = `
                    SELECT 
                        p.program_id,
                        p.university_name,
                        p.city,
                        p.faculty,
                        p.program_name,
                        p.score_type,
                        ys.year,
                        ys.min_score,
                        ys.rank,
                        ys.quota
                    FROM programs p
                    INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
                    WHERE p.program_id = ? AND ys.year = ?
                    LIMIT 1
                `;

                const result = await db.getFirstAsync<ProgramWithStats>(query, [programId, year]);
                return result || null;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to get program');
                console.error('Error getting program:', error);
                throw error;
            }
        },
        [db]
    );

    /**
     * Get all yearly stats for a specific program
     */
    const getProgramHistory = useCallback(
        async (programId: number): Promise<YearlyStat[]> => {
            if (!db) {
                throw new Error('Database not initialized');
            }

            try {
                const query = `
                    SELECT 
                        id,
                        program_id,
                        year,
                        min_score,
                        rank,
                        quota
                    FROM yearly_stats
                    WHERE program_id = ?
                    ORDER BY year DESC
                `;

                const results = await db.getAllAsync<YearlyStat>(query, [programId]);
                return results;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to get program history');
                console.error('Error getting program history:', error);
                throw error;
            }
        },
        [db]
    );

    /**
     * Get distinct values for filter options
     */
    const getFilterOptions = useCallback(async () => {
        if (!db) {
            throw new Error('Database not initialized');
        }

        try {
            const [cities, scoreTypes, faculties, universities] = await Promise.all([
                db.getAllAsync<{ city: string }>(
                    'SELECT DISTINCT city FROM programs ORDER BY city'
                ),
                db.getAllAsync<{ score_type: string }>(
                    'SELECT DISTINCT score_type FROM programs ORDER BY score_type'
                ),
                db.getAllAsync<{ faculty: string }>(
                    'SELECT DISTINCT faculty FROM programs ORDER BY faculty'
                ),
                db.getAllAsync<{ university_name: string }>(
                    'SELECT DISTINCT university_name FROM programs ORDER BY university_name'
                ),
            ]);

            return {
                cities: cities.map((c) => c.city),
                scoreTypes: scoreTypes.map((s) => s.score_type),
                faculties: faculties.map((f) => f.faculty),
                universities: universities.map((u) => u.university_name),
            };
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to get filter options');
            console.error('Error getting filter options:', error);
            throw error;
        }
    }, [db]);

    return {
        isLoading,
        error,
        searchPrograms,
        getProgramById,
        getProgramHistory,
        getFilterOptions,
        isReady: !!db && !isLoading,
    };
};
