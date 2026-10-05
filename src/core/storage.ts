import type { RunState } from './run';

const RUN_KEY = 'nikke-rogue:run:v1';

export function saveRun(run: RunState): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    // 시크릿 모드 등에서 저장이 막혀도 게임은 계속 진행한다.
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    return run.version === 1 && Array.isArray(run.party) && run.party.length > 0 ? run : null;
  } catch {
    return null;
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // 무시
  }
}
