import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';

interface EditorProps {
  initialCode: string;
  onChange?: (code: string) => void;
  onRun?: (code: string) => void;
}

export default function Editor({ initialCode, onChange, onRun }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const getCode = useCallback(() => {
    return viewRef.current?.state.doc.toString() ?? '';
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const runKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        run: () => {
          onRun?.(getCode());
          return true;
        },
      },
      {
        key: 'Cmd-Enter',
        run: () => {
          onRun?.(getCode());
          return true;
        },
      },
    ]);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange?.(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        runKeymap,
        updateListener,
        EditorView.theme({
          '&': { height: '100%', fontSize: '15px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only create editor once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor content when initialCode changes (e.g. navigating between levels)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== initialCode) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: initialCode },
      });
    }
  }, [initialCode]);

  return <div ref={containerRef} className="editor-container" />;
}

export { type EditorProps };
