/** 밸런스 조정용 수치는 여기에 모아 둔다. */
export const BALANCE = {
  starterLevel: 5,
  maxLevel: 100,
  startingBalls: 5,
  partyMax: 6,
  bossEvery: 10,
  bossLevelBonus: 3,
  critChance: 1 / 16,
  critMultiplier: 1.5,
  stabMultiplier: 1.5,
  /** 전투에 나오지 않은 동료가 받는 경험치 비율 */
  benchExpShare: 0.5,
  /** AI가 가장 좋은 기술을 고를 확률 (나머지는 무작위) */
  aiBestMoveChance: 0.75,
  /** 웨이브당 적 레벨 상승량 */
  enemyLevelPerWave: 0.6,
  expMultiplier: 2.5,
} as const;

export function enemyBaseLevel(wave: number): number {
  return 2 + Math.floor(wave * BALANCE.enemyLevelPerWave);
}

/** 해당 레벨에 도달하는 데 필요한 누적 경험치 */
export function expForLevel(level: number): number {
  return level <= 1 ? 0 : level ** 3;
}

export function expReward(expYield: number, enemyLevel: number, isBoss: boolean): number {
  return Math.floor(((expYield * enemyLevel) / 5) * (1 + enemyLevel / 10) * (isBoss ? 1.5 : 1) * BALANCE.expMultiplier);
}

export function captureChance(catchRate: number, hp: number, maxHp: number): number {
  const chance = catchRate * (1 - (2 / 3) * (hp / maxHp));
  return Math.min(0.95, Math.max(0.02, chance));
}
