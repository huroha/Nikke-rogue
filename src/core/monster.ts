import { BALANCE, expForLevel } from './balance';
import { getMove } from './data/moves';
import { getSpecies } from './data/species';
import { josa, josaRo } from './text';
import type { MonsterInstance, ProgressStep, Stats } from './types';

export function calcStats(mon: MonsterInstance): Stats {
  const { base } = getSpecies(mon.speciesId);
  const L = mon.level;
  const other = (b: number) => Math.floor((2 * b * L) / 100) + 5;
  return {
    hp: Math.floor((2 * base.hp * L) / 100) + L + 10,
    atk: other(base.atk),
    def: other(base.def),
    spa: other(base.spa),
    spd: other(base.spd),
    spe: other(base.spe),
  };
}

export function maxHp(mon: MonsterInstance): number {
  return calcStats(mon).hp;
}

export function displayName(mon: MonsterInstance): string {
  return getSpecies(mon.speciesId).name;
}

export function isFainted(mon: MonsterInstance): boolean {
  return mon.hp <= 0;
}

/** 해당 레벨까지 배울 수 있는 기술 중 마지막 4개를 가진 채로 생성 */
export function createMonster(speciesId: string, level: number, uid: string): MonsterInstance {
  const species = getSpecies(speciesId);
  const known: string[] = [];
  for (const entry of species.learnset) {
    if (entry.level <= level && !known.includes(entry.move)) known.push(entry.move);
  }
  const mon: MonsterInstance = {
    uid,
    speciesId,
    level,
    exp: expForLevel(level),
    hp: 0,
    moves: known.slice(-4).map((id) => ({ id, pp: getMove(id).pp })),
  };
  mon.hp = maxHp(mon);
  return mon;
}

export function healHp(mon: MonsterInstance, amount: number): number {
  const before = mon.hp;
  mon.hp = Math.min(maxHp(mon), mon.hp + Math.max(0, Math.floor(amount)));
  return mon.hp - before;
}

export function restorePp(mon: MonsterInstance): void {
  for (const slot of mon.moves) slot.pp = getMove(slot.id).pp;
}

/** 경험치를 주고 레벨업/기술 습득/진화 단계를 돌려준다. 진화는 단계 처리 시 적용한다. */
export function gainExp(mon: MonsterInstance, amount: number): ProgressStep[] {
  const steps: ProgressStep[] = [];
  if (amount <= 0 || mon.level >= BALANCE.maxLevel) return steps;
  const name = displayName(mon);
  steps.push({ kind: 'message', text: `${josa(name, '은', '는')} 경험치 ${amount}을 얻었다!` });
  mon.exp += amount;

  while (mon.level < BALANCE.maxLevel && mon.exp >= expForLevel(mon.level + 1)) {
    const oldMax = maxHp(mon);
    mon.level += 1;
    mon.hp += maxHp(mon) - oldMax;
    steps.push({ kind: 'message', text: `${name}의 레벨이 올랐다! (Lv.${mon.level})` });

    for (const entry of getSpecies(mon.speciesId).learnset) {
      if (entry.level !== mon.level || mon.moves.some((m) => m.id === entry.move)) continue;
      const move = getMove(entry.move);
      if (mon.moves.length < 4) {
        mon.moves.push({ id: move.id, pp: move.pp });
        steps.push({ kind: 'message', text: `${josa(name, '은', '는')} ${josa(move.name, '을', '를')} 배웠다!` });
      } else {
        steps.push({ kind: 'learn', uid: mon.uid, moveId: move.id });
      }
    }
  }
  if (mon.level >= BALANCE.maxLevel) mon.exp = expForLevel(BALANCE.maxLevel);

  const evo = getSpecies(mon.speciesId).evolution;
  if (evo && mon.level >= evo.level) steps.push({ kind: 'evolve', uid: mon.uid, into: evo.into });
  return steps;
}

/** 다음 레벨까지 필요한 경험치만큼 준다. */
export function gainLevel(mon: MonsterInstance): ProgressStep[] {
  if (mon.level >= BALANCE.maxLevel) return [];
  return gainExp(mon, expForLevel(mon.level + 1) - mon.exp);
}

export function evolve(mon: MonsterInstance, into: string): string {
  const before = displayName(mon);
  const oldMax = maxHp(mon);
  mon.speciesId = into;
  mon.hp = Math.max(1, mon.hp + maxHp(mon) - oldMax);
  return `${josa(before, '은', '는')} ${josaRo(displayName(mon))} 진화했다!`;
}

/** replaceIndex가 null이면 배우지 않는다. */
export function learnMove(mon: MonsterInstance, moveId: string, replaceIndex: number | null): string {
  const name = displayName(mon);
  const move = getMove(moveId);
  if (replaceIndex === null) return `${josa(name, '은', '는')} ${josa(move.name, '을', '를')} 배우지 않았다.`;
  const forgotten = getMove(mon.moves[replaceIndex].id);
  mon.moves[replaceIndex] = { id: move.id, pp: move.pp };
  return `${josa(name, '은', '는')} ${josa(forgotten.name, '을', '를')} 잊고 ${josa(move.name, '을', '를')} 배웠다!`;
}
