import { BALANCE, enemyBaseLevel, expReward } from './balance';
import type { Battle } from './battle';
import { getSpecies } from './data/species';
import { createMonster, displayName, gainExp } from './monster';
import type { Rng } from './rng';
import { josa } from './text';
import type { MonsterInstance, ProgressStep } from './types';

export interface RunState {
  version: 1;
  /** 지금 도전할 웨이브 (1부터) */
  wave: number;
  party: MonsterInstance[];
  balls: number;
  /** 웨이브 시작 시점의 난수 상태. 이어하기 시 같은 적이 나온다. */
  rngState: number;
  nextUid: number;
}

export function nextUid(run: RunState): string {
  return `m${run.nextUid++}`;
}

export function createRun(starterId: string, seed: number): RunState {
  const run: RunState = {
    version: 1,
    wave: 1,
    party: [],
    balls: BALANCE.startingBalls,
    rngState: seed >>> 0,
    nextUid: 1,
  };
  run.party.push(createMonster(starterId, BALANCE.starterLevel, nextUid(run)));
  return run;
}

export function isBossWave(wave: number): boolean {
  return wave % BALANCE.bossEvery === 0;
}

interface PoolEntry {
  id: string;
  fromWave: number;
  weight: number;
}

/** 야생 출현표. 진화형은 레벨이 되면 자동으로 진화한 모습으로 나온다. */
const WILD_POOL: PoolEntry[] = [
  { id: 'nubbit', fromWave: 1, weight: 10 },
  { id: 'flitter', fromWave: 1, weight: 8 },
  { id: 'zapple', fromWave: 1, weight: 6 },
  { id: 'pebblit', fromWave: 1, weight: 6 },
  { id: 'murkit', fromWave: 4, weight: 6 },
  { id: 'glimmo', fromWave: 6, weight: 5 },
  { id: 'cindle', fromWave: 15, weight: 1 },
  { id: 'drople', fromWave: 15, weight: 1 },
  { id: 'sproutle', fromWave: 15, weight: 1 },
];

export interface Encounter {
  enemy: MonsterInstance;
  isBoss: boolean;
}

export function generateEncounter(run: RunState, rng: Rng): Encounter {
  const isBoss = isBossWave(run.wave);
  // 초반 몇 웨이브는 레벨이 위로 튀지 않게 해서 상성이 나쁜 적에게 바로 전멸하지 않도록 한다.
  const roll = rng.int(-1, run.wave < 5 ? 0 : 1);
  const level = Math.max(2, enemyBaseLevel(run.wave) + roll) + (isBoss ? BALANCE.bossLevelBonus : 0);
  const pool = WILD_POOL.filter((e) => e.fromWave <= run.wave);
  let speciesId = rng.weighted(pool, (e) => e.weight).id;
  for (let evo = getSpecies(speciesId).evolution; evo && level >= evo.level; evo = getSpecies(speciesId).evolution) {
    speciesId = evo.into;
  }
  return { enemy: createMonster(speciesId, level, nextUid(run)), isBoss };
}

/** 전투 결과를 런에 반영한다. 승리/포획이면 경험치 단계들을 돌려주고 웨이브를 넘긴다. */
export function finishBattle(run: RunState, battle: Battle): ProgressStep[] {
  if (battle.outcome !== 'win' && battle.outcome !== 'captured') return [];
  const steps: ProgressStep[] = [];
  const enemy = battle.enemy;

  if (battle.outcome === 'captured') {
    run.party.push(enemy);
    steps.push({ kind: 'message', text: `${josa(displayName(enemy), '이', '가')} 동료가 되었다!` });
  }

  const total = expReward(getSpecies(enemy.speciesId).expYield, enemy.level, battle.options.isBoss);
  for (const mon of run.party) {
    if (mon === enemy || mon.hp <= 0) continue;
    const share = battle.participants.has(mon.uid) ? total : Math.floor(total * BALANCE.benchExpShare);
    steps.push(...gainExp(mon, share));
  }
  run.wave += 1;
  return steps;
}

export function isPartyWiped(run: RunState): boolean {
  return run.party.every((m) => m.hp <= 0);
}
