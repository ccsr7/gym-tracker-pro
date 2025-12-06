/**
 * Safe localStorage Service with caching, error handling, and automatic backups
 *
 * Features:
 * - Try-catch wrapper for all localStorage operations
 * - In-memory cache to reduce parsing overhead
 * - Automatic backups before writes
 * - Storage quota monitoring
 * - Data validation
 */

const STORAGE_KEYS = {
  USER: 'gym-tracker-user',
  USERS: 'gym-tracker-users',
  WORKOUTS: 'gym-tracker-workouts',
  ROUTINES: 'gym-tracker-routines',
  ACHIEVEMENTS: 'gym-tracker-achievements',
  SETTINGS: 'gym-tracker-settings',
} as const;

const BACKUP_PREFIX = 'gym-tracker-backup-';
const MAX_BACKUPS = 3;

interface StorageQuotaStatus {
  used: number;
  total: number;
  percentUsed: number;
  available: number;
}

class StorageService {
  private cache: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds

  /**
   * Get item from localStorage with caching
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      // Check cache first
      if (this.isCacheValid(key)) {
        return this.cache.get(key) as T;
      }

      // Get from localStorage
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const item = localStorage.getItem(key);

      if (item === null) {
        return defaultValue;
      }

      // Parse and cache
      const parsed = JSON.parse(item);
      this.updateCache(key, parsed);

      return parsed as T;
    } catch (error) {
      console.error(`[StorageService] Error reading key "${key}":`, error);

      // Try to recover from backup
      const backup = this.restoreFromBackup(key);
      if (backup !== null) {
        console.log(`[StorageService] Restored "${key}" from backup`);
        return backup as T;
      }

      return defaultValue;
    }
  }

  /**
   * Set item in localStorage with automatic backup
   */
  set<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      // Create backup of existing data
      this.createBackup(key);

      // Validate data size
      const serialized = JSON.stringify(value);

      if (!this.hasEnoughSpace(serialized.length)) {
        console.warn(`[StorageService] Not enough storage space for key "${key}"`);
        this.cleanOldBackups();

        // Try again after cleanup
        if (!this.hasEnoughSpace(serialized.length)) {
          throw new Error('Storage quota exceeded');
        }
      }

      // Save to localStorage
      localStorage.setItem(key, serialized);

      // Update cache
      this.updateCache(key, value);

      return true;
    } catch (error) {
      console.error(`[StorageService] Error writing key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      localStorage.removeItem(key);
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);

      return true;
    } catch (error) {
      console.error(`[StorageService] Error removing key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all app data (keeps backups)
   */
  clear(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      // Remove all app keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear cache
      this.cache.clear();
      this.cacheTimestamps.clear();

      return true;
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get storage quota status
   */
  getQuotaStatus(): StorageQuotaStatus {
    try {
      if (typeof window === 'undefined') {
        return { used: 0, total: 0, percentUsed: 0, available: 0 };
      }

      // Estimate storage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += key.length + (value?.length || 0);
        }
      }

      // Most browsers allow ~5-10MB for localStorage
      // We'll use conservative 5MB estimate
      const total = 5 * 1024 * 1024; // 5MB in bytes
      const percentUsed = (used / total) * 100;
      const available = total - used;

      return {
        used,
        total,
        percentUsed: Math.round(percentUsed * 10) / 10,
        available
      };
    } catch (error) {
      console.error('[StorageService] Error getting quota status:', error);
      return { used: 0, total: 0, percentUsed: 0, available: 0 };
    }
  }

  /**
   * Check if there's enough space for new data
   */
  private hasEnoughSpace(bytesNeeded: number): boolean {
    const quota = this.getQuotaStatus();
    return quota.available >= bytesNeeded;
  }

  /**
   * Create backup of existing data
   */
  private createBackup(key: string): void {
    try {
      if (typeof window === 'undefined') return;

      const existing = localStorage.getItem(key);
      if (existing === null) return;

      const backupKey = `${BACKUP_PREFIX}${key}-${Date.now()}`;
      localStorage.setItem(backupKey, existing);

      // Clean old backups if needed
      this.cleanOldBackups(key);
    } catch (error) {
      console.error(`[StorageService] Error creating backup for "${key}":`, error);
    }
  }

  /**
   * Restore data from most recent backup
   */
  private restoreFromBackup(key: string): any | null {
    try {
      if (typeof window === 'undefined') return null;

      const backupKeys = this.getBackupKeys(key);

      if (backupKeys.length === 0) return null;

      // Get most recent backup (highest timestamp)
      const latestBackup = backupKeys[backupKeys.length - 1];
      const backupData = localStorage.getItem(latestBackup);

      if (backupData === null) return null;

      const parsed = JSON.parse(backupData);

      // Restore to main key
      localStorage.setItem(key, backupData);

      return parsed;
    } catch (error) {
      console.error(`[StorageService] Error restoring backup for "${key}":`, error);
      return null;
    }
  }

  /**
   * Get all backup keys for a specific key
   */
  private getBackupKeys(key: string): string[] {
    if (typeof window === 'undefined') return [];

    const prefix = `${BACKUP_PREFIX}${key}-`;
    const backupKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(prefix)) {
        backupKeys.push(storageKey);
      }
    }

    // Sort by timestamp (embedded in key)
    return backupKeys.sort();
  }

  /**
   * Clean old backups, keeping only MAX_BACKUPS most recent
   */
  private cleanOldBackups(key?: string): void {
    try {
      if (typeof window === 'undefined') return;

      if (key) {
        // Clean backups for specific key
        const backupKeys = this.getBackupKeys(key);

        if (backupKeys.length > MAX_BACKUPS) {
          const toRemove = backupKeys.slice(0, backupKeys.length - MAX_BACKUPS);
          toRemove.forEach(k => localStorage.removeItem(k));
        }
      } else {
        // Clean all backups across all keys
        Object.values(STORAGE_KEYS).forEach(k => {
          this.cleanOldBackups(k);
        });
      }
    } catch (error) {
      console.error('[StorageService] Error cleaning old backups:', error);
    }
  }

  /**
   * Check if cached value is still valid
   */
  private isCacheValid(key: string): boolean {
    if (!this.cache.has(key)) return false;

    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;

    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Update cache with new value
   */
  private updateCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidateCache(key: string): void {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Export all app data for backup
   */
  exportData(): Record<string, any> {
    const data: Record<string, any> = {};

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = this.get(key, null);
      if (value !== null) {
        data[name] = value;
      }
    });

    return data;
  }

  /**
   * Import data from backup
   */
  importData(data: Record<string, any>): boolean {
    try {
      Object.entries(data).forEach(([name, value]) => {
        const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
        if (key) {
          this.set(key, value);
        }
      });
      return true;
    } catch (error) {
      console.error('[StorageService] Error importing data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export storage keys for use in components
export { STORAGE_KEYS };
export type { StorageQuotaStatus };
