import { gainLevel, healHp, maxHp, restorePp } from './monster';
import type { Rng } from './rng';
import type { RunState } from './run';
import type { ProgressStep } from './types';

export interface RewardDef {
  id: string;
  name: string;
  description: string;
  /** 0 이하이면 이번에는 나오지 않는다 */
  weight: (run: RunState) => number;
  apply: (run: RunState) => ProgressStep[];
}

const msg = (text: string): ProgressStep => ({ kind: 'message', text });
const alive = (run: RunState) => run.party.filter((m) => m.hp > 0);
const anyHurt = (run: RunState) => alive(run).some((m) => m.hp < maxHp(m));

export const REWARDS: RewardDef[] = [
  {
    id: 'spring',
    name: '회복의 샘',
    description: '쓰러지지 않은 동료 전원의 HP를 최대치의 50% 회복',
    weight: (run) => (anyHurt(run) ? 10 : 2),
    apply: (run) => {
      for (const m of alive(run)) healHp(m, maxHp(m) / 2);
      return [msg('동료들의 체력이 회복되었다!')];
    },
  },
  {
    id: 'full-restore',
    name: '만능 회복약',
    description: '쓰러지지 않은 동료 전원의 HP를 완전히 회복',
    weight: (run) => (anyHurt(run) ? 3 : 0),
    apply: (run) => {
      for (const m of alive(run)) healHp(m, maxHp(m));
      return [msg('동료들의 체력이 완전히 회복되었다!')];
    },
  },
  {
    id: 'phoenix-feather',
    name: '불사조 깃털',
    description: '쓰러진 동료 전원을 HP 50%로 되살린다',
    weight: (run) => (run.party.some((m) => m.hp <= 0) ? 8 : 0),
    apply: (run) => {
      for (const m of run.party) if (m.hp <= 0) m.hp = Math.max(1, Math.floor(maxHp(m) / 2));
      return [msg('쓰러진 동료들이 다시 일어났다!')];
    },
  },
  {
    id: 'growth-crystal',
    name: '성장 결정',
    description: '쓰러지지 않은 동료 전원의 레벨 +1',
    weight: () => 6,
    apply: (run) => alive(run).flatMap((m) => gainLevel(m)),
  },
  {
    id: 'ball-pack',
    name: '포획구 묶음',
    description: '포획구 +3',
    weight: (run) => (run.balls < 3 ? 9 : 5),
    apply: (run) => {
      run.balls += 3;
      return [msg(`포획구를 3개 얻었다! (보유 ${run.balls}개)`)];
    },
  },
  {
    id: 'ether',
    name: '기력 회복제',
    description: '동료 전원의 PP를 완전히 회복',
    weight: () => 4,
    apply: (run) => {
      for (const m of run.party) restorePp(m);
      return [msg('동료들의 PP가 회복되었다!')];
    },
  },
];

/** 서로 다른 보상 count개를 가중치에 따라 뽑는다. */
export function rollRewards(run: RunState, rng: Rng, count = 3): RewardDef[] {
  const pool = REWARDS.filter((r) => r.weight(run) > 0);
  const picked: RewardDef[] = [];
  while (picked.length < count && pool.length > 0) {
    const choice = rng.weighted(pool, (r) => r.weight(run));
    picked.push(choice);
    pool.splice(pool.indexOf(choice), 1);
  }
  return picked;
}
