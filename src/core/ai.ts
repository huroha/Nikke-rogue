import { BALANCE } from './balance';
import { getMove } from './data/moves';
import { getSpecies } from './data/species';
import { typeEffectiveness } from './data/typeChart';
import { maxHp } from './monster';
import type { Rng } from './rng';
import type { MonsterInstance } from './types';

/** 적이 사용할 기술 슬롯 번호. PP가 모두 없으면 0(전투 쪽에서 몸부림 처리). */
export function chooseEnemyMove(self: MonsterInstance, foe: MonsterInstance, rng: Rng): number {
  const usable = self.moves.map((_, i) => i).filter((i) => self.moves[i].pp > 0);
  if (usable.length === 0) return 0;
  if (!rng.chance(BALANCE.aiBestMoveChance)) return rng.pick(usable);

  const selfTypes = getSpecies(self.speciesId).types;
  const foeTypes = getSpecies(foe.speciesId).types;
  const score = (i: number): number => {
    const move = getMove(self.moves[i].id);
    if (move.category === 'status') {
      const heals = move.effects?.some((e) => e.kind === 'heal');
      if (heals) return self.hp < maxHp(self) / 2 ? 90 : 0;
      return 20;
    }
    const stab = selfTypes.includes(move.type) ? BALANCE.stabMultiplier : 1;
    return move.power * ((move.accuracy ?? 100) / 100) * typeEffectiveness(move.type, foeTypes) * stab;
  };
  return usable.reduce((best, i) => (score(i) > score(best) ? i : best), usable[0]);
}
