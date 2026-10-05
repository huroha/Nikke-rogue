import { Rng } from './core/rng';
import { createRun, type RunState } from './core/run';
import { clearRun, loadRun, saveRun } from './core/storage';

/** 씬들이 공유하는 현재 런. */
export const session = {
  run: null as RunState | null,
  rng: new Rng(1),
};

export function requireRun(): RunState {
  if (!session.run) throw new Error('no active run');
  return session.run;
}

export function startNewRun(starterId: string): void {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  session.run = createRun(starterId, seed);
  session.rng = new Rng(seed);
}

export function resumeRun(): boolean {
  const run = loadRun();
  if (!run) return false;
  session.run = run;
  session.rng = new Rng(0);
  session.rng.state = run.rngState;
  return true;
}

export function hasSavedRun(): boolean {
  return loadRun() !== null;
}

/** 웨이브 시작 시점에 저장한다. */
export function persistRun(): void {
  const run = requireRun();
  run.rngState = session.rng.state;
  saveRun(run);
}

export function endRun(): void {
  clearRun();
  session.run = null;
}
