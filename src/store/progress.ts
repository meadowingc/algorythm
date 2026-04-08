import { useState, useCallback, useEffect } from 'react';

interface LevelProgress {
  completed: boolean;
  bestScore: number;
}

interface GameProgress {
  levels: Record<string, LevelProgress>;
}

const STORAGE_KEY = 'algorythm_progress';
const CODE_STORAGE_KEY = 'algorythm_code';

function load(): GameProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GameProgress;
  } catch { /* ignore corrupt data */ }
  return { levels: {} };
}

function save(progress: GameProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getUserCode(levelId: string): string | null {
  try {
    const raw = localStorage.getItem(CODE_STORAGE_KEY);
    if (raw) {
      const codes = JSON.parse(raw) as Record<string, string>;
      return codes[levelId] ?? null;
    }
  } catch { /* ignore corrupt data */ }
  return null;
}

export function saveUserCode(levelId: string, code: string): void {
  try {
    const raw = localStorage.getItem(CODE_STORAGE_KEY);
    const codes = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    codes[levelId] = code;
    localStorage.setItem(CODE_STORAGE_KEY, JSON.stringify(codes));
  } catch { /* ignore */ }
}

export function useProgress() {
  const [progress, setProgress] = useState<GameProgress>(load);

  useEffect(() => {
    save(progress);
  }, [progress]);

  const isCompleted = useCallback(
    (levelId: string) => progress.levels[levelId]?.completed ?? false,
    [progress],
  );

  const getBestScore = useCallback(
    (levelId: string) => progress.levels[levelId]?.bestScore ?? 0,
    [progress],
  );

  const markCompleted = useCallback((levelId: string, score: number) => {
    setProgress((prev) => {
      const existing = prev.levels[levelId];
      const bestScore = Math.max(existing?.bestScore ?? 0, score);
      return {
        ...prev,
        levels: {
          ...prev.levels,
          [levelId]: { completed: true, bestScore },
        },
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({ levels: {} });
  }, []);

  return {
    progress,
    isCompleted,
    getBestScore,
    markCompleted,
    resetProgress,
  };
}
