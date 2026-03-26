import { useState, useCallback, useRef, useEffect } from 'react';
import type { LevelDef } from '../levels';
import { playCode, stopPlayback, ensureInit } from '../engine/strudel';
import { evaluatePuzzle, type EvalResult } from '../engine/evaluate';
import Editor from './Editor';

interface PuzzleViewProps {
  level: LevelDef;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export default function PuzzleView({ level, onComplete, onBack }: PuzzleViewProps) {
  const [, setCode] = useState(level.starterCode);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playingTarget, setPlayingTarget] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [initDone, setInitDone] = useState(false);
  const codeRef = useRef(level.starterCode);

  const handleCodeChange = useCallback((newCode: string) => {
    codeRef.current = newCode;
    setCode(newCode);
  }, []);

  const handleInit = useCallback(async () => {
    if (initDone) return;
    await ensureInit();
    setInitDone(true);
  }, [initDone]);

  const handlePlay = useCallback(async () => {
    await handleInit();
    try {
      stopPlayback();
      setPlayingTarget(false);
      await playCode(codeRef.current);
      setPlaying(true);
    } catch (e: unknown) {
      setPlaying(false);
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ pass: false, score: 0, feedback: `Error: ${msg}` });
    }
  }, [handleInit]);

  const handlePlayTarget = useCallback(async () => {
    await handleInit();
    try {
      stopPlayback();
      setPlaying(false);
      await playCode(level.targetCode);
      setPlayingTarget(true);
    } catch (e: unknown) {
      setPlayingTarget(false);
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ pass: false, score: 0, feedback: `Error playing target: ${msg}` });
    }
  }, [level.targetCode, handleInit]);

  const handleStop = useCallback(() => {
    stopPlayback();
    setPlaying(false);
    setPlayingTarget(false);
  }, []);

  const handleCheck = useCallback(async () => {
    await handleInit();
    handleStop();
    try {
      const evalResult = await evaluatePuzzle(codeRef.current, level);
      setResult(evalResult);
      if (evalResult.pass) {
        onComplete(evalResult.score);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ pass: false, score: 0, feedback: `Error: ${msg}` });
    }
  }, [level, onComplete, handleStop, handleInit]);

  const handleRun = useCallback(
    (runCode: string) => {
      codeRef.current = runCode;
      setCode(runCode);
      handlePlay();
    },
    [handlePlay],
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + . to stop
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        handleStop();
      }
      // Ctrl/Cmd + Shift + Enter to listen to target
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (level.type !== 'freeform') {
          if (playingTarget) {
            handleStop();
          } else {
            handlePlayTarget();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStop, handlePlayTarget, level.type, playingTarget]);

  const showNextHint = () => {
    if (hintIndex < level.hints.length - 1) {
      setHintIndex(hintIndex + 1);
    }
  };

  const typeLabel: Record<string, string> = {
    completion: 'Pattern Completion',
    recreate: 'Recreate',
    freeform: 'Free Creation',
  };

  return (
    <div className="puzzle-view">
      <header className="puzzle-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div className="puzzle-title-area">
          <span className="puzzle-type-badge">{typeLabel[level.type]}</span>
          <h2>{level.title}</h2>
        </div>
      </header>

      <div className="puzzle-body">
        <aside className="puzzle-instructions">
          <p className="puzzle-description">{level.description}</p>

          {level.type !== 'freeform' && (
            <div className="target-controls">
              <button
                className={`btn btn-secondary ${playingTarget ? 'active' : ''}`}
                onClick={playingTarget ? handleStop : handlePlayTarget}
              >
                {playingTarget ? '⏹ Stop Target' : '🎧 Listen to Target'}
              </button>
            </div>
          )}

          {hintIndex >= 0 && (
            <div className="hints-area">
              {level.hints.slice(0, hintIndex + 1).map((hint, i) => (
                <p key={i} className="hint">
                  💡 {hint}
                </p>
              ))}
            </div>
          )}

          {hintIndex < level.hints.length - 1 && (
            <button className="btn btn-ghost hint-btn" onClick={showNextHint}>
              Need a hint? ({level.hints.length - hintIndex - 1} remaining)
            </button>
          )}

          {result && (
            <div className={`result-card ${result.pass ? 'result-pass' : 'result-fail'}`}>
              <p className="result-feedback">{result.feedback}</p>
              {result.pass && <p className="result-score">Score: {result.score}%</p>}
            </div>
          )}
        </aside>

        <main className="puzzle-editor-area">
          <Editor
            initialCode={level.starterCode}
            onChange={handleCodeChange}
            onRun={handleRun}
          />

          <div className="editor-controls">
            <button
              className={`btn btn-primary ${playing ? 'active' : ''}`}
              onClick={playing ? handleStop : handlePlay}
            >
              {playing ? '⏹ Stop' : '▶ Play'}
            </button>
            <button className="btn btn-accent" onClick={handleCheck}>
              ✓ Check
            </button>
            <span className="editor-hint">
              <kbd>Ctrl+Enter</kbd> play · <kbd>Ctrl+.</kbd> stop · <kbd>Ctrl+Shift+Enter</kbd> target
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
