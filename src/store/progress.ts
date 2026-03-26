import { useState, useCallback, useEffect } from 'react';

interface LevelProgress {
  completed: boolean;
  bestScore: number;
}

interface GameProgress {
  levels: Record<string, LevelProgress>;
}

const STORAGE_KEY = 'algorythm_progress';

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

  const isChapterUnlocked = useCallback(
    (chapter: number) => {
      if (chapter <= 1) return true;
      // A chapter is unlocked if the previous chapter's last level is completed
      // We check if any level from the previous chapter is completed
      // More precisely: at least 3 of 5 levels from previous chapter
      const prevChapterLevels = Object.entries(progress.levels).filter(
        ([key]) => {
          // level ids follow pattern: beat-1..5, note-1..5, fx-1..5
          const prefixes: Record<number, string> = { 1: 'beat-', 2: 'note-', 3: 'fx-' };
          return key.startsWith(prefixes[chapter - 1] ?? '');
        },
      );
      const completedCount = prevChapterLevels.filter(([, v]) => v.completed).length;
      return completedCount >= 3;
    },
    [progress],
  );

  const resetProgress = useCallback(() => {
    setProgress({ levels: {} });
  }, []);

  return {
    progress,
    isCompleted,
    getBestScore,
    markCompleted,
    isChapterUnlocked,
    resetProgress,
  };
}
