import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';

interface EditorProps {
  initialCode: string;
  onChange?: (code: string) => void;
  onRun?: (code: string) => void;
}

export default function Editor({ initialCode, onChange, onRun }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  const getCode = useCallback(() => {
    return viewRef.current?.state.doc.toString() ?? '';
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const runKeymap = Prec.highest(
      keymap.of([
        {
          key: 'Ctrl-Enter',
          run: () => {
            onRunRef.current?.(getCode());
            return true;
          },
        },
        {
          key: 'Cmd-Enter',
          run: () => {
            onRunRef.current?.(getCode());
            return true;
          },
        },
      ]),
    );

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange?.(update.state.doc.toString());
      }
    });

    // Minimal dark theme — pure black, neon accents
    const editorTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        background: '#000000',
      },
      '.cm-scroller': { overflow: 'auto' },
      '.cm-content': {
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        caretColor: '#00ffd5',
      },
      '.cm-cursor': { borderLeftColor: '#00ffd5' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        background: '#00ffd520 !important',
      },
      '.cm-activeLine': { background: '#ffffff06' },
      '.cm-gutters': {
        background: '#000000',
        color: '#333',
        border: 'none',
        borderRight: '1px solid #1a1a1a',
      },
      '.cm-activeLineGutter': { background: '#ffffff06', color: '#555' },
      '.cm-foldPlaceholder': { background: '#1a1a1a', border: 'none', color: '#555' },
      '.cm-tooltip': { background: '#0a0a0a', border: '1px solid #1a1a1a' },
      '.cm-tooltip-autocomplete': { background: '#0a0a0a' },
      '.cm-matchingBracket': { background: '#00ffd520', outline: '1px solid #00ffd540' },
    }, { dark: true });

    const highlightStyle = syntaxHighlighting(HighlightStyle.define([
      { tag: tags.keyword, color: '#ff3355' },
      { tag: tags.function(tags.variableName), color: '#00ffd5' },
      { tag: tags.string, color: '#ffaa00' },
      { tag: tags.number, color: '#00ff88' },
      { tag: tags.bool, color: '#00ff88' },
      { tag: tags.comment, color: '#333', fontStyle: 'italic' },
      { tag: tags.variableName, color: '#d4d4d4' },
      { tag: tags.propertyName, color: '#00ffd5' },
      { tag: tags.operator, color: '#555' },
      { tag: tags.punctuation, color: '#555' },
      { tag: tags.bracket, color: '#555' },
      { tag: tags.typeName, color: '#00ffd5' },
      { tag: tags.definition(tags.variableName), color: '#d4d4d4' },
    ]));

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        javascript(),
        editorTheme,
        highlightStyle,
        runKeymap,
        updateListener,
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
