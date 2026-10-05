import { BALANCE } from './balance';
import { getSpecies } from './data/species';
import { typeEffectiveness } from './data/typeChart';
import { calcStats } from './monster';
import type { Rng } from './rng';
import type { MonsterInstance, MoveData, Stages } from './types';

export function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  critical: boolean;
}

export function computeDamage(
  attacker: MonsterInstance,
  defender: MonsterInstance,
  move: MoveData,
  attackerStages: Stages,
  defenderStages: Stages,
  rng: Rng,
): DamageResult {
  const effectiveness = typeEffectiveness(move.type, getSpecies(defender.speciesId).types);
  if (move.category === 'status' || move.power <= 0 || effectiveness === 0) {
    return { damage: 0, effectiveness, critical: false };
  }

  const critical = rng.chance(BALANCE.critChance);
  const physical = move.category === 'physical';
  const atkKey = physical ? 'atk' : 'spa';
  const defKey = physical ? 'def' : 'spd';
  let atkStage = attackerStages[atkKey];
  let defStage = defenderStages[defKey];
  // 급소는 자신에게 불리한 랭크 변화를 무시한다.
  if (critical) {
    atkStage = Math.max(0, atkStage);
    defStage = Math.min(0, defStage);
  }
  const A = calcStats(attacker)[atkKey] * stageMultiplier(atkStage);
  const D = calcStats(defender)[defKey] * stageMultiplier(defStage);

  const base = Math.floor(Math.floor((Math.floor((2 * attacker.level) / 5 + 2) * move.power * A) / D) / 50) + 2;
  const stab = getSpecies(attacker.speciesId).types.includes(move.type) ? BALANCE.stabMultiplier : 1;
  const crit = critical ? BALANCE.critMultiplier : 1;
  const roll = 0.85 + rng.next() * 0.15;
  const damage = Math.max(1, Math.floor(base * stab * effectiveness * crit * roll));
  return { damage, effectiveness, critical };
}
