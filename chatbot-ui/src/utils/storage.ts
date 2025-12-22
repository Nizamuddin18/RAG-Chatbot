/**
 * Safe localStorage utilities with quota management and validation
 */

import { sanitizeInput } from './security';

const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit (localStorage is typically 5-10MB)
const MAX_MESSAGES_PER_AGENT = 100; // Limit messages to prevent quota issues

interface StorageData {
  version: string;
  timestamp: number;
  data: unknown;
}

/**
 * Safely get item from localStorage with validation
 */
export const safeGetItem = <T>(key: string, validator?: (data: unknown) => data is T): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed: StorageData = JSON.parse(item);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
      console.warn(`Invalid storage data structure for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    // Check version compatibility (add version migration logic here if needed)
    if (parsed.version !== '1.0') {
      console.warn(`Incompatible storage version for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    // Optional validator
    if (validator && !validator(parsed.data)) {
      console.warn(`Data validation failed for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    // Clear potentially corrupted data
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors during cleanup
    }
    return null;
  }
};

/**
 * Safely set item in localStorage with quota management
 */
export const safeSetItem = (key: string, value: unknown): boolean => {
  try {
    const storageData: StorageData = {
      version: '1.0',
      timestamp: Date.now(),
      data: value,
    };

    const serialized = JSON.stringify(storageData);

    // Check size
    if (serialized.length > MAX_STORAGE_SIZE) {
      console.error(`Data too large for localStorage (${serialized.length} bytes)`);
      return false;
    }

    // Check available quota
    const currentSize = getStorageSize();
    if (currentSize + serialized.length > MAX_STORAGE_SIZE) {
      console.warn('localStorage quota exceeded, clearing old data');
      clearOldestData();
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      clearOldestData();
      // Try again after clearing
      try {
        localStorage.setItem(key, JSON.stringify({ version: '1.0', timestamp: Date.now(), data: value }));
        return true;
      } catch (retryError) {
        console.error('Failed to save after clearing storage:', retryError);
        return false;
      }
    }
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely remove item from localStorage
 */
export const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

/**
 * Get current localStorage size in bytes
 */
const getStorageSize = (): number => {
  let size = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
  }
  return size;
};

/**
 * Clear oldest data from localStorage
 */
const clearOldestData = (): void => {
  try {
    const items: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat_history_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          items.push({
            key,
            timestamp: data.timestamp || 0,
          });
        } catch (e) {
          // If can't parse, mark for deletion
          items.push({ key, timestamp: 0 });
        }
      }
    }

    // Sort by timestamp and remove oldest 25%
    items.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(items.length * 0.25);

    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key);
    }

    console.log(`Cleared ${toRemove} old chat histories`);
  } catch (error) {
    console.error('Error clearing old data:', error);
  }
};

/**
 * Trim messages array to max limit
 */
export const trimMessages = <T>(messages: T[], maxCount: number = MAX_MESSAGES_PER_AGENT): T[] => {
  if (messages.length <= maxCount) return messages;
  
  // Keep most recent messages
  return messages.slice(-maxCount);
};

/**
 * Sanitize message content before storage
 */
export const sanitizeMessageForStorage = (message: any): any => {
  if (!message || typeof message !== 'object') return message;

  return {
    ...message,
    content: typeof message.content === 'string' ? sanitizeInput(message.content) : message.content,
  };
};
