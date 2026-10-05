export const ELEMENT_TYPES = [
  'neutral',
  'blaze',
  'tide',
  'verdant',
  'volt',
  'stone',
  'gale',
  'shade',
  'lumen',
] as const;
export type ElementType = (typeof ELEMENT_TYPES)[number];

export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type Stats = Record<StatKey, number>;
export type StageStat = Exclude<StatKey, 'hp'>;
export type Stages = Record<StageStat, number>;

export type MoveCategory = 'physical' | 'special' | 'status';

export type MoveEffect =
  /** 능력치 랭크 변화. chance(%)가 없으면 항상 발동. */
  | { kind: 'stage'; target: 'self' | 'foe'; stat: StageStat; stages: number; chance?: number }
  /** 사용자 최대 HP 대비 회복 */
  | { kind: 'heal'; ratio: number }
  /** 준 데미지 대비 회복 */
  | { kind: 'drain'; ratio: number }
  /** 준 데미지 대비 반동 */
  | { kind: 'recoil'; ratio: number };

export interface MoveData {
  id: string;
  name: string;
  type: ElementType;
  category: MoveCategory;
  power: number;
  /** null이면 반드시 명중 */
  accuracy: number | null;
  pp: number;
  priority: number;
  effects?: MoveEffect[];
  description: string;
}

export interface SpeciesData {
  id: string;
  name: string;
  types: [ElementType] | [ElementType, ElementType];
  base: Stats;
  learnset: { level: number; move: string }[];
  evolution?: { level: number; into: string };
  /** 0~1, 높을수록 잡기 쉬움 */
  catchRate: number;
  expYield: number;
}

export interface MoveSlot {
  id: string;
  pp: number;
}

/** 런 동안 저장되는 몬스터 개체. JSON 직렬화 가능해야 한다. */
export interface MonsterInstance {
  uid: string;
  speciesId: string;
  level: number;
  exp: number;
  hp: number;
  moves: MoveSlot[];
}

/** 전투 후/보상 후 화면에서 순서대로 처리할 진행 단계 */
export type ProgressStep =
  | { kind: 'message'; text: string }
  /** 기술이 4개라 자동으로 배우지 못한 경우: 플레이어가 잊을 기술을 고른다 */
  | { kind: 'learn'; uid: string; moveId: string }
  | { kind: 'evolve'; uid: string; into: string };
