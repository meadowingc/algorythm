import { useState, useCallback, useRef, useEffect } from 'react';
import type { LevelDef } from '../levels';
import { playCode, stopPlayback, ensureInit, preloadSounds } from '../engine/strudel';
import { evaluatePuzzle, type EvalResult } from '../engine/evaluate';
import { getUserCode, saveUserCode } from '../store/progress';
import Editor from './Editor';

interface PuzzleViewProps {
  level: LevelDef;
  onComplete: (score: number) => void;
  onBack: () => void;
  onNext?: () => void;
  nextLevelTitle?: string;
}

export default function PuzzleView({ level, onComplete, onBack, onNext, nextLevelTitle }: PuzzleViewProps) {
  const savedCode = getUserCode(level.id) ?? level.starterCode;
  const [, setCode] = useState(savedCode);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playingTarget, setPlayingTarget] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [initDone, setInitDone] = useState(false);
  const codeRef = useRef(savedCode);

  // Preload samples for this level on mount
  useEffect(() => {
    preloadSounds(level.targetCode);
  }, [level.targetCode]);

  const handleCodeChange = useCallback((newCode: string) => {
    codeRef.current = newCode;
    setCode(newCode);
    saveUserCode(level.id, newCode);
  }, [level.id]);

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
    completion: 'fill',
    recreate: 'recreate',
    freeform: 'free',
  };

  return (
    <div className="puzzle-view">
      <header className="puzzle-header">
        <button className="btn btn-ghost" onClick={onBack}>
          &lt;- back
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
                {playingTarget ? '[] stop' : '> listen to target'}
              </button>
            </div>
          )}

          {hintIndex >= 0 && (
            <div className="hints-area">
              {level.hints.slice(0, hintIndex + 1).map((hint, i) => (
                <p key={i} className="hint">
                  {hint}
                </p>
              ))}
            </div>
          )}

          {hintIndex < level.hints.length - 1 && (
            <button className="btn btn-ghost hint-btn" onClick={showNextHint}>
              hint? ({level.hints.length - hintIndex - 1} remaining)
            </button>
          )}

          {result && (
            <div className={`result-card ${result.pass ? 'result-pass' : 'result-fail'}`}>
              <p className="result-feedback">{result.feedback}</p>
              {result.pass && <p className="result-score">Score: {result.score}%</p>}
              {result.pass && (
                <div className="result-actions">
                  {onNext ? (
                    <button className="btn btn-primary" onClick={onNext}>
                      next: {nextLevelTitle} -&gt;
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={onBack}>
                      back to levels
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="puzzle-editor-area">
          <Editor
            initialCode={savedCode}
            onChange={handleCodeChange}
            onRun={handleRun}
          />

          <div className="editor-controls">
            <button
              className={`btn btn-primary ${playing ? 'active' : ''}`}
              onClick={playing ? handleStop : handlePlay}
            >
              {playing ? '[] stop' : '> play'}
            </button>
            <button className="btn btn-accent" onClick={handleCheck}>
              check
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
