import type { SpeciesData } from '../types';

const LIST: SpeciesData[] = [
  // 스타터: 화염
  {
    id: 'cindle', name: '불똥이', types: ['blaze'],
    base: { hp: 39, atk: 55, def: 40, spa: 60, spd: 45, spe: 65 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'snarl' }, { level: 5, move: 'cinder' },
      { level: 9, move: 'quick-jab' }, { level: 13, move: 'flame-dash' }, { level: 20, move: 'fighting-spirit' },
      { level: 28, move: 'scorch-cannon' }, { level: 34, move: 'rush' },
    ],
    evolution: { level: 16, into: 'pyrrox' }, catchRate: 0.35, expYield: 62,
  },
  {
    id: 'pyrrox', name: '불꽃갈기', types: ['blaze'],
    base: { hp: 75, atk: 95, def: 70, spa: 100, spd: 70, spe: 100 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'snarl' }, { level: 5, move: 'cinder' },
      { level: 9, move: 'quick-jab' }, { level: 13, move: 'flame-dash' }, { level: 20, move: 'fighting-spirit' },
      { level: 28, move: 'scorch-cannon' }, { level: 34, move: 'rush' },
    ],
    catchRate: 0.15, expYield: 160,
  },

  // 스타터: 해류
  {
    id: 'drople', name: '물콩이', types: ['tide'],
    base: { hp: 50, atk: 45, def: 55, spa: 55, spd: 55, spe: 45 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'spray' }, { level: 6, move: 'guard-stance' },
      { level: 12, move: 'torrent-slash' }, { level: 20, move: 'umbra-shot' }, { level: 28, move: 'tidal-cannon' },
    ],
    evolution: { level: 16, into: 'tidalisk' }, catchRate: 0.35, expYield: 62,
  },
  {
    id: 'tidalisk', name: '해일뱀', types: ['tide', 'shade'],
    base: { hp: 90, atk: 80, def: 85, spa: 95, spd: 90, spe: 70 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'spray' }, { level: 6, move: 'guard-stance' },
      { level: 12, move: 'torrent-slash' }, { level: 20, move: 'umbra-shot' }, { level: 28, move: 'tidal-cannon' },
    ],
    catchRate: 0.15, expYield: 160,
  },

  // 스타터: 초목
  {
    id: 'sproutle', name: '싹틔미', types: ['verdant'],
    base: { hp: 45, atk: 50, def: 55, spa: 50, spd: 60, spe: 45 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'leaf-shot' }, { level: 5, move: 'guard-stance' },
      { level: 10, move: 'root-drain' }, { level: 14, move: 'thorn-lash' }, { level: 18, move: 'pebble-toss' },
      { level: 30, move: 'bedrock-slam' },
    ],
    evolution: { level: 16, into: 'thornox' }, catchRate: 0.35, expYield: 62,
  },
  {
    id: 'thornox', name: '가시뿔', types: ['verdant', 'stone'],
    base: { hp: 80, atk: 100, def: 100, spa: 70, spd: 90, spe: 70 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'leaf-shot' }, { level: 5, move: 'guard-stance' },
      { level: 10, move: 'root-drain' }, { level: 14, move: 'thorn-lash' }, { level: 18, move: 'pebble-toss' },
      { level: 30, move: 'bedrock-slam' },
    ],
    catchRate: 0.15, expYield: 160,
  },

  // 야생
  {
    id: 'nubbit', name: '몽실이', types: ['neutral'],
    base: { hp: 50, atk: 45, def: 40, spa: 30, spd: 40, spe: 50 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'snarl' }, { level: 6, move: 'quick-jab' },
      { level: 10, move: 'swipe' }, { level: 18, move: 'rush' }, { level: 22, move: 'fighting-spirit' },
    ],
    catchRate: 0.9, expYield: 40,
  },
  {
    id: 'zapple', name: '찌릿콩', types: ['volt'],
    base: { hp: 40, atk: 45, def: 35, spa: 65, spd: 45, spe: 80 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'jolt' }, { level: 7, move: 'nimble' },
      { level: 12, move: 'volt-claw' }, { level: 24, move: 'thunderstrike' },
    ],
    catchRate: 0.6, expYield: 60,
  },
  {
    id: 'pebblit', name: '조약돌이', types: ['stone'],
    base: { hp: 45, atk: 70, def: 80, spa: 25, spd: 40, spe: 25 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'guard-stance' }, { level: 6, move: 'pebble-toss' },
      { level: 12, move: 'swipe' }, { level: 22, move: 'bedrock-slam' }, { level: 26, move: 'torrent-slash' },
    ],
    evolution: { level: 22, into: 'bouldron' }, catchRate: 0.6, expYield: 58,
  },
  {
    id: 'bouldron', name: '바위거북', types: ['stone', 'tide'],
    base: { hp: 85, atk: 105, def: 125, spa: 45, spd: 75, spe: 35 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'guard-stance' }, { level: 6, move: 'pebble-toss' },
      { level: 12, move: 'swipe' }, { level: 22, move: 'bedrock-slam' }, { level: 26, move: 'torrent-slash' },
    ],
    catchRate: 0.25, expYield: 150,
  },
  {
    id: 'flitter', name: '팔랑새', types: ['gale'],
    base: { hp: 40, atk: 50, def: 40, spa: 40, spd: 40, spe: 75 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'wind-cutter' }, { level: 8, move: 'nimble' },
      { level: 14, move: 'sky-dive' }, { level: 20, move: 'shadow-talon' }, { level: 26, move: 'fighting-spirit' },
    ],
    evolution: { level: 20, into: 'galeclaw' }, catchRate: 0.7, expYield: 52,
  },
  {
    id: 'galeclaw', name: '폭풍매', types: ['gale', 'shade'],
    base: { hp: 70, atk: 95, def: 65, spa: 70, spd: 65, spe: 115 },
    learnset: [
      { level: 1, move: 'bump' }, { level: 1, move: 'wind-cutter' }, { level: 8, move: 'nimble' },
      { level: 14, move: 'sky-dive' }, { level: 20, move: 'shadow-talon' }, { level: 26, move: 'fighting-spirit' },
    ],
    catchRate: 0.25, expYield: 150,
  },
  {
    id: 'murkit', name: '그늘냥', types: ['shade'],
    base: { hp: 45, atk: 60, def: 45, spa: 55, spd: 45, spe: 70 },
    learnset: [
      { level: 1, move: 'swipe' }, { level: 1, move: 'snarl' }, { level: 8, move: 'shadow-talon' },
      { level: 12, move: 'quick-jab' }, { level: 18, move: 'umbra-shot' },
    ],
    catchRate: 0.5, expYield: 64,
  },
  {
    id: 'glimmo', name: '반딧빛', types: ['lumen'],
    base: { hp: 50, atk: 30, def: 45, spa: 65, spd: 65, spe: 50 },
    learnset: [
      { level: 1, move: 'glint' }, { level: 8, move: 'mending-light' }, { level: 14, move: 'light-beam' },
      { level: 20, move: 'wind-cutter' }, { level: 24, move: 'nimble' },
    ],
    evolution: { level: 24, into: 'aurelune' }, catchRate: 0.5, expYield: 60,
  },
  {
    id: 'aurelune', name: '오로라나비', types: ['lumen', 'gale'],
    base: { hp: 75, atk: 50, def: 70, spa: 105, spd: 100, spe: 90 },
    learnset: [
      { level: 1, move: 'glint' }, { level: 8, move: 'mending-light' }, { level: 14, move: 'light-beam' },
      { level: 20, move: 'wind-cutter' }, { level: 24, move: 'nimble' },
    ],
    catchRate: 0.2, expYield: 155,
  },
];

export const SPECIES: Record<string, SpeciesData> = Object.fromEntries(LIST.map((s) => [s.id, s]));

export const STARTERS = ['cindle', 'drople', 'sproutle'] as const;

export function getSpecies(id: string): SpeciesData {
  const s = SPECIES[id];
  if (!s) throw new Error(`unknown species: ${id}`);
  return s;
}
