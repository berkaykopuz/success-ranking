import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { ProgramWithStats, YearlyStat, ProgramSearchFilters } from '@/src/types/ranking';

// Database configuration constants
const DB_NAME = 'yks_rankings.db';
const SQLITE_DIR = 'SQLite';
const DEFAULT_YEAR = 2025;

// Database instance cache
let databaseInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Get the document directory path
 * Handles TypeScript type issues with expo-file-system
 */
const getDocumentDirectory = (): string => {
  // @ts-ignore - documentDirectory exists but TypeScript types may be incomplete
  return FileSystem.documentDirectory || '';
};

/**
 * Get the internal database path
 * expo-sqlite stores databases in documentDirectory/SQLite/ on iOS
 */
const getDatabasePath = (): string => {
  const documentDir = getDocumentDirectory();
  const sqlDir = `${documentDir}${SQLITE_DIR}/`;
  return `${sqlDir}${DB_NAME}`;
};

/**
 * Initialize the database connection.
 * 
 * This function:
 * 1. Checks if the database file exists in the app's internal storage
 * 2. If not, copies the pre-filled database from the assets folder
 * 3. Opens and returns a database connection
 * 
 * Uses a singleton pattern to ensure only one initialization happens at a time.
 * 
 * @returns Promise resolving to the SQLite database instance
 * @throws Error if database initialization fails
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  // Return cached instance if already initialized
  if (databaseInstance && isInitialized) {
    return databaseInstance;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      const internalDbPath = getDatabasePath();
      const documentDir = getDocumentDirectory();
      const sqlDir = `${documentDir}${SQLITE_DIR}/`;

      // Check if database already exists
      const fileInfo = await FileSystem.getInfoAsync(internalDbPath);

      if (!fileInfo.exists) {
        console.log('[Database] Database not found. Initializing from assets...');

        // Ensure SQLite directory exists (expo-sqlite uses documentDirectory/SQLite/)
        const dirInfo = await FileSystem.getInfoAsync(sqlDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(sqlDir, { intermediates: true });
          console.log('[Database] Created SQLite directory:', sqlDir);
        }

        // Load and download the database asset
        const asset = Asset.fromModule(require('@/assets/yks_rankings.db'));
        await asset.downloadAsync();

        if (!asset.localUri) {
          throw new Error('Failed to download database asset: localUri is null');
        }

        // Copy database from assets to SQLite directory
        // expo-sqlite looks for databases in documentDirectory/SQLite/ on iOS
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: internalDbPath,
        });

        console.log('[Database] Database successfully copied to:', internalDbPath);
      } else {
        console.log('[Database] Database found at:', internalDbPath);
      }

      // Open database connection using just the database name
      // expo-sqlite automatically looks in documentDirectory/SQLite/ for the database
      // Passing a full path is not supported - only the database name
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      
      // Verify database is accessible
      await db.getFirstAsync('SELECT 1 as test');
      
      databaseInstance = db;
      isInitialized = true;
      
      console.log('[Database] Database initialized successfully');
      return db;
    } catch (error) {
      console.error('[Database] Initialization error:', error);
      isInitialized = false;
      databaseInstance = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

/**
 * Initialize the database (legacy function for backward compatibility).
 * This is a wrapper around getDatabase() that doesn't return the instance.
 */
export const initDatabase = async (): Promise<void> => {
  await getDatabase();
};

/**
 * Close the database connection.
 * Useful for cleanup or testing.
 */
export const closeDatabase = async (): Promise<void> => {
  if (databaseInstance) {
    await databaseInstance.closeAsync();
    databaseInstance = null;
    isInitialized = false;
    initPromise = null;
    console.log('[Database] Database connection closed');
  }
};

/**
 * Check if database is initialized
 */
export const isDatabaseReady = (): boolean => {
  return isInitialized && databaseInstance !== null;
};

// ============================================================================
// GENERIC QUERY FUNCTIONS (For raw SQL queries)
// ============================================================================

/**
 * Execute a SQL query and return all matching rows.
 * Generic function for executing any SELECT query.
 * 
 * @param query - SQL query string with optional ? placeholders
 * @param params - Array of parameters to bind to the query
 * @returns Promise resolving to array of results
 */
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const db = await getDatabase();
  
  try {
    const results = await db.getAllAsync<T>(query, params);
    return results;
  } catch (error) {
    console.error('[Database] Error executing query:', error);
    console.error('[Database] Query:', query);
    console.error('[Database] Params:', params);
    throw error;
  }
};

/**
 * Execute a SQL query and return the first matching row.
 * Generic function for executing SELECT queries that return a single row.
 * 
 * @param query - SQL query string with optional ? placeholders
 * @param params - Array of parameters to bind to the query
 * @returns Promise resolving to the first result, or null if no results
 */
export const executeQuerySingle = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> => {
  const db = await getDatabase();
  
  try {
    const result = await db.getFirstAsync<T>(query, params);
    return result || null;
  } catch (error) {
    console.error('[Database] Error executing query (single):', error);
    console.error('[Database] Query:', query);
    console.error('[Database] Params:', params);
    throw error;
  }
};

// ============================================================================
// REPOSITORY FUNCTIONS (Data Access Layer)
// ============================================================================

/**
 * Search for university programs with advanced filtering.
 * Joins 'programs' with 'yearly_stats' to filter by score/rank.
 * 
 * @param filters - Search filters to apply
 * @returns Promise resolving to array of programs with their stats
 */
export const searchPrograms = async (
  filters: ProgramSearchFilters = {}
): Promise<ProgramWithStats[]> => {
  const db = await getDatabase();
  
  // Build base query with JOIN
  let query = `
    SELECT 
      p.*,
      ys.year,
      ys.taban_puan as min_score,
      ys.basari_sirasi as rank,
      ys.kontenjan as quota
    FROM programs p
    INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
    WHERE ys.taban_puan > 0
  `;
  
  const params: any[] = [];

  // Text filters (case-insensitive via LIKE)
  if (filters.universityName) {
    query += ' AND p.university_name LIKE ?';
    params.push(`%${filters.universityName}%`);
  }

  if (filters.programName) {
    query += ' AND p.program_name LIKE ?';
    params.push(`%${filters.programName}%`);
  }

  if (filters.faculty) {
    query += ' AND p.faculty LIKE ?';
    params.push(`%${filters.faculty}%`);
  }

  // Exact match filters
  if (filters.city) {
    query += ' AND p.location_city = ?';
    params.push(filters.city);
  }

  if (filters.scoreType) {
    query += ' AND p.score_type = ?';
    params.push(filters.scoreType);
  }

  // Year filter (default to latest year if not specified)
  const year = filters.year ?? DEFAULT_YEAR;
  query += ' AND ys.year = ?';
  params.push(year);

  // Numeric range filters
  if (filters.minScore !== undefined) {
    query += ' AND ys.taban_puan >= ?';
    params.push(filters.minScore);
  }

  if (filters.maxScore !== undefined) {
    query += ' AND ys.taban_puan <= ?';
    params.push(filters.maxScore);
  }

  if (filters.minRank !== undefined) {
    query += ' AND ys.basari_sirasi >= ?';
    params.push(filters.minRank);
  }

  if (filters.maxRank !== undefined) {
    query += ' AND ys.basari_sirasi <= ?';
    params.push(filters.maxRank);
  }

  // Order and limit results
  query += ' ORDER BY ys.taban_puan DESC LIMIT 100';

  try {
    const results = await db.getAllAsync<ProgramWithStats>(query, params);
    return results;
  } catch (error) {
    console.error('[Database] Error searching programs:', error);
    console.error('[Database] Query:', query);
    console.error('[Database] Params:', params);
    throw error;
  }
};

/**
 * Fetch all available distinct cities for filter dropdowns.
 * 
 * @returns Promise resolving to array of unique city names, sorted alphabetically
 */
export const getDistinctCities = async (): Promise<string[]> => {
  const db = await getDatabase();
  
  try {
    const results = await db.getAllAsync<{ location_city: string }>(
      `SELECT DISTINCT location_city 
       FROM programs 
       WHERE location_city IS NOT NULL AND location_city != '' 
       ORDER BY location_city`
    );
    return results.map((r) => r.location_city);
  } catch (error) {
    console.error('[Database] Error fetching cities:', error);
    throw error;
  }
};

/**
 * Fetch distinct score types for filter dropdowns.
 * 
 * @returns Promise resolving to array of unique score types
 */
export const getDistinctScoreTypes = async (): Promise<string[]> => {
  const db = await getDatabase();
  
  try {
    const results = await db.getAllAsync<{ score_type: string }>(
      `SELECT DISTINCT score_type 
       FROM programs 
       WHERE score_type IS NOT NULL AND score_type != '' 
       ORDER BY score_type`
    );
    return results.map((r) => r.score_type);
  } catch (error) {
    console.error('[Database] Error fetching score types:', error);
    throw error;
  }
};

/**
 * Fetch detailed history for a specific program.
 * Returns yearly stats ordered by year (newest first).
 * 
 * @param programId - The ID of the program to get history for
 * @returns Promise resolving to array of yearly statistics
 */
export const getProgramHistory = async (programId: number): Promise<YearlyStat[]> => {
  const db = await getDatabase();
  
  try {
    const results = await db.getAllAsync<YearlyStat>(
      `SELECT * 
       FROM yearly_stats 
       WHERE program_id = ? 
       ORDER BY year DESC`,
      [programId]
    );
    return results;
  } catch (error) {
    console.error('[Database] Error fetching program history:', error);
    throw error;
  }
};

/**
 * Get a single program by ID with its stats for a specific year.
 * 
 * @param programId - The ID of the program
 * @param year - The year to get stats for (defaults to DEFAULT_YEAR)
 * @returns Promise resolving to program with stats, or null if not found
 */
export const getProgramById = async (
  programId: number,
  year: number = DEFAULT_YEAR
): Promise<ProgramWithStats | null> => {
  const db = await getDatabase();
  
  try {
    const result = await db.getFirstAsync<ProgramWithStats>(
      `SELECT 
        p.*,
        ys.year,
        ys.taban_puan as min_score,
        ys.basari_sirasi as rank,
        ys.kontenjan as quota
       FROM programs p
       INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
       WHERE p.program_id = ? AND ys.year = ?
       LIMIT 1`,
      [programId, year]
    );
    return result || null;
  } catch (error) {
    console.error('[Database] Error fetching program by ID:', error);
    throw error;
  }
};

/**
 * Interface for user puan data
 */
export interface UserPuan {
  tyt_puan?: number | null;
  say_puan?: number | null;
  ea_puan?: number | null;
  soz_puan?: number | null;
  dil_puan?: number | null;
  tyt_yerlesme?: number | null;
  say_yerlesme?: number | null;
  ea_yerlesme?: number | null;
  soz_yerlesme?: number | null;
  dil_yerlesme?: number | null;
}

/**
 * Fetch user yerleştirme puanları from the yearly_stats table.
 * Uses the programs and yearly_stats tables to get reference yerleştirme puanları
 * that can be used for comparison or assignment.
 * 
 * @param scoreType - The score type (TYT, SAY, EA, SÖZ, DİL)
 * @returns Promise resolving to array of yerleştirme puanları from programs
 */
export const getYerlesmePuanlariFromPrograms = async (
  scoreType: string
): Promise<number[]> => {
  const db = await getDatabase();
  
  try {
    const results = await db.getAllAsync<{ taban_puan: number }>(
      `SELECT DISTINCT ys.taban_puan
       FROM programs p
       INNER JOIN yearly_stats ys ON p.program_id = ys.program_id
       WHERE p.score_type = ?
         AND ys.year = 2025
         AND ys.taban_puan > 0
       ORDER BY ys.taban_puan DESC
       LIMIT 100`,
      [scoreType]
    );
    return results.map((row) => row.taban_puan);
  } catch (error) {
    console.error('[Database] Error fetching yerleştirme puanları:', error);
    return [];
  }
};