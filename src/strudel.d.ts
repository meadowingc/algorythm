declare module '@strudel/web' {
  export function initStrudel(options?: Record<string, unknown>): Promise<unknown>;
  export function evaluate(code: string, autoplay?: boolean): Promise<unknown>;
  export function hush(): void;
  export function defaultPrebake(): Promise<void>;
  export function getAudioContext(): AudioContext;
  export function samples(source: string | Record<string, unknown>): Promise<void>;
  export function getSound(s: string): { onTrigger: unknown; data: { samples: unknown } } | undefined;
  export function getSampleBuffer(
    hapValue: Record<string, unknown>,
    bank: unknown,
  ): Promise<{ buffer: AudioBuffer; playbackRate: number }>;
}

declare module '@strudel/core' {
  export function sequence(...args: unknown[]): unknown;
  export class Pattern {
    queryArc(begin: number, end: number): Array<{
      value: Record<string, unknown>;
      whole?: { begin: { valueOf(): number }; end: { valueOf(): number } };
      part: { begin: { valueOf(): number }; end: { valueOf(): number } };
    }>;
    firstCycle(): unknown[];
  }
}
