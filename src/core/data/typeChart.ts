import type { ElementType } from '../types';

export const TYPE_NAMES: Record<ElementType, string> = {
  neutral: '무속성',
  blaze: '화염',
  tide: '해류',
  verdant: '초목',
  volt: '전격',
  stone: '암석',
  gale: '질풍',
  shade: '그림자',
  lumen: '광휘',
};

type Row = Partial<Record<ElementType, number>>;

/** 공격 타입 → 방어 타입 배율. 적혀 있지 않으면 1배. */
const CHART: Record<ElementType, Row> = {
  neutral: { stone: 0.5 },
  blaze: { verdant: 2, shade: 2, tide: 0.5, stone: 0.5, blaze: 0.5 },
  tide: { blaze: 2, stone: 2, tide: 0.5, verdant: 0.5 },
  verdant: { tide: 2, stone: 2, blaze: 0.5, gale: 0.5, verdant: 0.5 },
  volt: { tide: 2, gale: 2, verdant: 0.5, volt: 0.5, stone: 0 },
  stone: { blaze: 2, volt: 2, gale: 2, verdant: 0.5 },
  gale: { verdant: 2, stone: 0.5, volt: 0.5 },
  shade: { lumen: 2, shade: 0.5 },
  lumen: { shade: 2, lumen: 0.5, blaze: 0.5 },
};

export function typeEffectiveness(attack: ElementType, defender: readonly ElementType[]): number {
  return defender.reduce((mult, def) => mult * (CHART[attack][def] ?? 1), 1);
}
