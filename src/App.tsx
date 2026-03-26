import { useState, useCallback } from 'react';
import { levels } from './levels';
import { useProgress } from './store/progress';
import LevelSelect from './components/LevelSelect';
import PuzzleView from './components/PuzzleView';
import './App.css';

export default function App() {
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const { isCompleted, getBestScore, markCompleted, isChapterUnlocked } = useProgress();

  const currentLevel = currentLevelId
    ? levels.find((l) => l.id === currentLevelId)
    : null;

  const handleSelectLevel = useCallback((levelId: string) => {
    setCurrentLevelId(levelId);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentLevelId(null);
  }, []);

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
