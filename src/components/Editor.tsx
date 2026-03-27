import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, Decoration, WidgetType, type DecorationSet } from '@codemirror/view';
import { EditorState, Prec, StateField, StateEffect } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { __pianoroll } from '@strudel/draw';
import type { VizWidgetKind, VizWidgetInfo } from '../engine/strudel';

/** A pair of [from, to] offsets to highlight. */
export type HighlightRange = [number, number];

/** Methods exposed to parent via ref. */
export interface EditorHandle {
  /** Set the currently active highlight ranges (call on each frame). */
  setHighlights(ranges: HighlightRange[]): void;
  /** Place inline visualization widgets in the editor. */
  setInlineWidgets(widgets: VizWidgetInfo[]): void;
  /** Draw all inline visualization canvases (call on each frame while playing). */
  drawInlineWidgets(pattern: unknown, time: number): void;
  /** Clear all inline visualization canvases. */
  clearInlineWidgets(): void;
  /** Replace the entire editor content. */
  setCode(code: string): void;
}

// StateEffect to push new highlight ranges into the editor
const setHighlightsEffect = StateEffect.define<HighlightRange[]>();

const highlightMark = Decoration.mark({ class: 'cm-strudel-active' });

const highlightsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setHighlightsEffect)) {
        const docLen = tr.state.doc.length;
        const marks = e.value
          .filter(([from, to]) => from >= 0 && to > from && to <= docLen)
          .sort((a, b) => a[0] - b[0] || a[1] - b[1])
          .map(([from, to]) => highlightMark.range(from, to));
        return Decoration.set(marks);
      }
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ── Inline visualization widgets (pianoroll / punchcard) ──────────────

/** Global registry of active inline-viz canvases for drawing. */
const vizCanvasMap = new Map<string, { canvas: HTMLCanvasElement; kind: VizWidgetKind; trackRange?: [number, number] }>();

const setInlineWidgetsEffect = StateEffect.define<VizWidgetInfo[]>();

class InlineVizWidget extends WidgetType {
  id: string;
  kind: VizWidgetKind;
  trackRange?: [number, number];
  constructor(id: string, kind: VizWidgetKind, trackRange?: [number, number]) {
    super();
    this.id = id;
    this.kind = kind;
    this.trackRange = trackRange;
  }

  eq(other: InlineVizWidget) {
    return this.id === other.id && this.kind === other.kind;
  }

  toDOM() {
    const existing = vizCanvasMap.get(this.id);
    if (existing?.canvas.parentElement && existing.canvas.parentElement.isConnected) {
      // Update trackRange in case it changed
      existing.trackRange = this.trackRange;
      return existing.canvas.parentElement;
    }

    // Remove stale entry if it exists
    vizCanvasMap.delete(this.id);

    const wrapper = document.createElement('div');
    wrapper.className = 'cm-inline-viz';
    const canvas = document.createElement('canvas');
    canvas.className = 'cm-inline-viz-canvas';
    wrapper.appendChild(canvas);
    vizCanvasMap.set(this.id, { canvas, kind: this.kind, trackRange: this.trackRange });
    return wrapper;
  }

  destroy() {
    vizCanvasMap.delete(this.id);
  }
}

const inlineWidgetsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(setInlineWidgetsEffect)) {
        const docLen = tr.state.doc.length;
        // Clear stale entries from the canvas map
        const newIds = new Set<string>();
        const decos = e.value
          .filter((w) => w.pos >= 0 && w.pos <= docLen)
          .map((w) => {
            const id = `${w.kind}_${w.pos}`;
            newIds.add(id);
            return Decoration.widget({
              widget: new InlineVizWidget(id, w.kind, w.trackRange),
              side: 1,
              block: true,
            }).range(w.pos);
          })
          .sort((a, b) => a.from - b.from);
        // Remove canvas entries that are no longer present
        for (const key of vizCanvasMap.keys()) {
          if (!newIds.has(key)) vizCanvasMap.delete(key);
        }
        return Decoration.set(decos);
      }
    }
    return value.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** Draw on a single inline-viz canvas. */
function drawVizCanvas(
  canvas: HTMLCanvasElement,
  kind: VizWidgetKind,
  pattern: { queryArc(b: number, e: number): unknown[] },
  time: number,
  trackRange?: [number, number],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Resize to match CSS layout size (retina-aware)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (w === 0 || h === 0) return;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const cycles = 4;
  const playhead = 0.5;
  const lb = cycles * playhead;
  const la = cycles * (1 - playhead);
  let haps = pattern.queryArc(time - lb, time + la);

  // Filter haps to only those from this $: track
  if (trackRange) {
    haps = haps.filter((hap: unknown) => {
      const h = hap as { context?: { locations?: Array<{ start: number; end: number }> } };
      const locs = h?.context?.locations;
      if (!locs || locs.length === 0) return true;
      return locs.some(loc => loc.start >= trackRange[0] && loc.start < trackRange[1]);
    });
  }

  const punchcardOpts = kind === 'punchcard'
    ? { labels: 1, stroke: 0, fillActive: 1, active: 'white', inactive: '#333' }
    : {};

  __pianoroll({
    time,
    haps: haps as Parameters<typeof __pianoroll>[0]['haps'],
    ctx,
    cycles,
    playhead,
    active: '#00ffd5',
    inactive: '#1a3a35',
    background: 'transparent',
    playheadColor: '#00ffd5',
    fold: 1,
    autorange: 1,
    fill: 1,
    fillActive: 1,
    ...punchcardOpts,
  });
}

interface EditorProps {
  initialCode: string;
  onChange?: (code: string) => void;
  onRun?: (code: string) => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { initialCode, onChange, onRun },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  useImperativeHandle(ref, () => ({
    setHighlights(ranges: HighlightRange[]) {
      viewRef.current?.dispatch({
        effects: setHighlightsEffect.of(ranges),
      });
    },
    setInlineWidgets(widgets: VizWidgetInfo[]) {
      viewRef.current?.dispatch({
        effects: setInlineWidgetsEffect.of(widgets),
      });
    },
    drawInlineWidgets(pattern: unknown, time: number) {
      const pat = pattern as { queryArc(b: number, e: number): unknown[] } | null;
      if (!pat) return;
      for (const { canvas, kind, trackRange } of vizCanvasMap.values()) {
        drawVizCanvas(canvas, kind, pat, time, trackRange);
      }
    },
    clearInlineWidgets() {
      viewRef.current?.dispatch({
        effects: setInlineWidgetsEffect.of([]),
      });
    },
    setCode(code: string) {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      });
    },
  }));

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
        highlightsField,
        inlineWidgetsField,
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
});

export default Editor;

export { type EditorProps };
