import { useState, useEffect } from 'react';
import {
  Project,
  Block,
  Apartment,
  Category,
  Contractor,
  Reserve,
  Task,
  Reception
} from '@/types';
import { getDefaultCategories } from '@/utils/defaultCategories';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Dispatch custom event for auto-sync
      window.dispatchEvent(new Event('sniper-data-change'));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hooks spécialisés pour chaque entité
export const useProjects = () => useLocalStorage<Project[]>('projects', []);
export const useBlocks = () => useLocalStorage<Block[]>('blocks', []);
export const useApartments = () => useLocalStorage<Apartment[]>('apartments', []);
export const useCategories = () => useLocalStorage<Category[]>('categories', getDefaultCategories());
export const useContractors = () => useLocalStorage<Contractor[]>('contractors', []);
export const useReserves = () => useLocalStorage<Reserve[]>('reserves', []);
export const useTasks = () => useLocalStorage<Task[]>('tasks', []);
export const useReceptions = () => useLocalStorage<Reception[]>('receptions', []);

// Utilitaires pour générer des IDs uniques
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};