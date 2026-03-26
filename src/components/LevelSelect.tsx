import { chapters, levels } from '../levels';

interface LevelSelectProps {
  onSelectLevel: (levelId: string) => void;
  isCompleted: (levelId: string) => boolean;
  getBestScore: (levelId: string) => number;
  isChapterUnlocked: (chapter: number) => boolean;
}

export default function LevelSelect({
  onSelectLevel,
  isCompleted,
  getBestScore,
  isChapterUnlocked,
}: LevelSelectProps) {
  return (
    <div className="level-select">
      <header className="level-select-header">
        <h1 className="logo">
          <span className="logo-algo">algo</span>
          <span className="logo-rythm">rythm</span>
        </h1>
        <p className="tagline">learn to code music // one puzzle at a time</p>
      </header>

      <div className="chapters">
        {chapters.map((chapter) => {
          const unlocked = isChapterUnlocked(chapter.id);
          const chapterLevels = levels.filter((l) => l.chapter === chapter.id);
          const completedCount = chapterLevels.filter((l) =>
            isCompleted(l.id),
          ).length;

          return (
            <section
              key={chapter.id}
              className={`chapter-card ${unlocked ? '' : 'chapter-locked'}`}
            >
              <div className="chapter-header">
                <h2>
                  <span className="chapter-number">Chapter {chapter.id}</span>
                  {chapter.title}
                </h2>
                <p className="chapter-desc">{chapter.description}</p>
                <span className="chapter-progress">
                  {completedCount}/{chapterLevels.length} completed
                </span>
              </div>

              {!unlocked && (
                <p className="locked-msg">
                  // complete 3 levels from the previous chapter to unlock
                </p>
              )}

              {unlocked && (
                <div className="level-grid">
                  {chapterLevels.map((level) => {
                    const done = isCompleted(level.id);
                    const score = getBestScore(level.id);
                    const typeTag =
                      level.type === 'completion'
                        ? 'fill'
                        : level.type === 'recreate'
                          ? 'ear'
                          : 'free';

                    return (
                      <button
                        key={level.id}
                        className={`level-card ${done ? 'level-done' : ''}`}
                        onClick={() => onSelectLevel(level.id)}
                      >
                        <span className="level-num">
                          {level.chapter}.{level.levelInChapter} {typeTag}
                        </span>
                        <span className="level-title">{level.title}</span>
                        {done && (
                          <span className="level-score">{score}%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
