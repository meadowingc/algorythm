import { useState, useCallback, useEffect } from 'react';
import { levels } from './levels';
import { useProgress } from './store/progress';
import LevelSelect from './components/LevelSelect';
import PuzzleView from './components/PuzzleView';
import './App.css';

/** Read level id from current URL path (e.g. /level/beat-1 → "beat-1"). */
function levelIdFromPath(): string | null {
  const match = window.location.pathname.match(/^\/level\/([a-z0-9-]+)$/i);
  if (!match) return null;
  const id = match[1];
  return levels.some((l) => l.id === id) ? id : null;
}

export default function App() {
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(levelIdFromPath);
  const { isCompleted, getBestScore, markCompleted, isChapterUnlocked } = useProgress();

  // Sync with browser back/forward
  useEffect(() => {
    const onPopState = () => setCurrentLevelId(levelIdFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const currentLevel = currentLevelId
    ? levels.find((l) => l.id === currentLevelId)
    : null;

  const currentIndex = currentLevel ? levels.indexOf(currentLevel) : -1;
  const nextLevel = currentIndex >= 0 && currentIndex < levels.length - 1
    ? levels[currentIndex + 1]
    : null;

  const handleSelectLevel = useCallback((levelId: string) => {
    setCurrentLevelId(levelId);
    window.history.pushState(null, '', `/level/${levelId}`);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentLevelId(null);
    window.history.pushState(null, '', '/');
  }, []);

  const handleNext = useCallback(() => {
    if (nextLevel) {
      setCurrentLevelId(nextLevel.id);
      window.history.pushState(null, '', `/level/${nextLevel.id}`);
    }
  }, [nextLevel]);

  const handleComplete = useCallback(
    (score: number) => {
      if (currentLevelId) {
        markCompleted(currentLevelId, score);
      }
    },
    [currentLevelId, markCompleted],
  );

  if (currentLevel) {
    return (
      <PuzzleView
        key={currentLevel.id}
        level={currentLevel}
        onComplete={handleComplete}
        onBack={handleBack}
        onNext={nextLevel ? handleNext : undefined}
        nextLevelTitle={nextLevel?.title}
      />
    );
  }

  return (
    <LevelSelect
      onSelectLevel={handleSelectLevel}
      isCompleted={isCompleted}
      getBestScore={getBestScore}
      isChapterUnlocked={isChapterUnlocked}
    />
  );
}
