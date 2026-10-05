import type { MoveData } from '../types';

const LIST: MoveData[] = [
  // 무속성
  { id: 'bump', name: '들이받기', type: 'neutral', category: 'physical', power: 40, accuracy: 100, pp: 35, priority: 0, description: '몸으로 들이받는다.' },
  { id: 'swipe', name: '할퀴기', type: 'neutral', category: 'physical', power: 50, accuracy: 95, pp: 30, priority: 0, description: '날카롭게 할퀸다.' },
  { id: 'quick-jab', name: '선제 찌르기', type: 'neutral', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, description: '반드시 먼저 공격한다.' },
  { id: 'rush', name: '돌격', type: 'neutral', category: 'physical', power: 80, accuracy: 90, pp: 15, priority: 0, effects: [{ kind: 'recoil', ratio: 0.25 }], description: '준 데미지의 1/4을 반동으로 받는다.' },
  { id: 'snarl', name: '으르렁대기', type: 'neutral', category: 'status', power: 0, accuracy: 100, pp: 30, priority: 0, effects: [{ kind: 'stage', target: 'foe', stat: 'atk', stages: -1 }], description: '상대의 공격을 1랭크 낮춘다.' },
  { id: 'guard-stance', name: '버티기 자세', type: 'neutral', category: 'status', power: 0, accuracy: null, pp: 20, priority: 0, effects: [{ kind: 'stage', target: 'self', stat: 'def', stages: 2 }], description: '자신의 방어를 2랭크 올린다.' },
  { id: 'nimble', name: '날쌘 몸놀림', type: 'neutral', category: 'status', power: 0, accuracy: null, pp: 20, priority: 0, effects: [{ kind: 'stage', target: 'self', stat: 'spe', stages: 2 }], description: '자신의 스피드를 2랭크 올린다.' },
  { id: 'fighting-spirit', name: '투지', type: 'neutral', category: 'status', power: 0, accuracy: null, pp: 20, priority: 0, effects: [{ kind: 'stage', target: 'self', stat: 'atk', stages: 2 }], description: '자신의 공격을 2랭크 올린다.' },

  // 화염
  { id: 'cinder', name: '불티', type: 'blaze', category: 'special', power: 40, accuracy: 100, pp: 25, priority: 0, description: '작은 불티를 날린다.' },
  { id: 'flame-dash', name: '화염돌진', type: 'blaze', category: 'physical', power: 75, accuracy: 95, pp: 15, priority: 0, description: '불꽃을 두르고 돌진한다.' },
  { id: 'scorch-cannon', name: '작열포', type: 'blaze', category: 'special', power: 90, accuracy: 85, pp: 10, priority: 0, description: '뜨거운 열기를 쏘아낸다.' },

  // 해류
  { id: 'spray', name: '물보라', type: 'tide', category: 'special', power: 40, accuracy: 100, pp: 25, priority: 0, description: '물보라를 뿌린다.' },
  { id: 'torrent-slash', name: '급류베기', type: 'tide', category: 'physical', power: 75, accuracy: 95, pp: 15, priority: 0, description: '급류처럼 베어낸다.' },
  { id: 'tidal-cannon', name: '해일포', type: 'tide', category: 'special', power: 90, accuracy: 85, pp: 10, priority: 0, description: '거대한 물결을 쏘아낸다.' },

  // 초목
  { id: 'leaf-shot', name: '잎날리기', type: 'verdant', category: 'special', power: 40, accuracy: 100, pp: 25, priority: 0, description: '날카로운 잎을 날린다.' },
  { id: 'thorn-lash', name: '가시덩굴', type: 'verdant', category: 'physical', power: 75, accuracy: 95, pp: 15, priority: 0, description: '가시 돋친 덩굴로 후려친다.' },
  { id: 'root-drain', name: '뿌리흡착', type: 'verdant', category: 'special', power: 60, accuracy: 100, pp: 15, priority: 0, effects: [{ kind: 'drain', ratio: 0.5 }], description: '준 데미지의 절반만큼 회복한다.' },

  // 전격
  { id: 'jolt', name: '전류 튕기기', type: 'volt', category: 'special', power: 40, accuracy: 100, pp: 25, priority: 0, description: '약한 전류를 튕긴다.' },
  { id: 'volt-claw', name: '번개발톱', type: 'volt', category: 'physical', power: 70, accuracy: 95, pp: 15, priority: 0, description: '전기를 머금은 발톱으로 벤다.' },
  { id: 'thunderstrike', name: '뇌격', type: 'volt', category: 'special', power: 90, accuracy: 85, pp: 10, priority: 0, description: '강한 벼락을 떨어뜨린다.' },

  // 암석
  { id: 'pebble-toss', name: '돌팔매', type: 'stone', category: 'physical', power: 50, accuracy: 90, pp: 25, priority: 0, description: '돌을 던진다.' },
  { id: 'bedrock-slam', name: '암반강타', type: 'stone', category: 'physical', power: 85, accuracy: 85, pp: 10, priority: 0, description: '단단한 몸으로 내리찍는다.' },

  // 질풍
  { id: 'wind-cutter', name: '바람가르기', type: 'gale', category: 'special', power: 45, accuracy: 100, pp: 25, priority: 0, description: '바람의 칼날을 날린다.' },
  { id: 'sky-dive', name: '급강하', type: 'gale', category: 'physical', power: 75, accuracy: 95, pp: 15, priority: 0, description: '높은 곳에서 내리꽂힌다.' },

  // 그림자
  { id: 'shadow-talon', name: '그림자발톱', type: 'shade', category: 'physical', power: 60, accuracy: 100, pp: 20, priority: 0, effects: [{ kind: 'stage', target: 'foe', stat: 'def', stages: -1, chance: 20 }], description: '20% 확률로 상대의 방어를 낮춘다.' },
  { id: 'umbra-shot', name: '음영탄', type: 'shade', category: 'special', power: 75, accuracy: 100, pp: 15, priority: 0, description: '어둠을 뭉쳐 쏜다.' },

  // 광휘
  { id: 'glint', name: '반짝임', type: 'lumen', category: 'special', power: 40, accuracy: 100, pp: 25, priority: 0, description: '눈부신 빛을 터뜨린다.' },
  { id: 'light-beam', name: '빛줄기', type: 'lumen', category: 'special', power: 70, accuracy: 100, pp: 15, priority: 0, effects: [{ kind: 'stage', target: 'foe', stat: 'spa', stages: -1, chance: 10 }], description: '10% 확률로 상대의 특수공격을 낮춘다.' },
  { id: 'mending-light', name: '치유의 빛', type: 'lumen', category: 'status', power: 0, accuracy: null, pp: 10, priority: 0, effects: [{ kind: 'heal', ratio: 0.5 }], description: '최대 HP의 절반을 회복한다.' },
];

/** 모든 기술의 PP가 바닥났을 때 쓰는 기술. 기술 목록에는 들어가지 않는다. */
export const STRUGGLE: MoveData = {
  id: 'struggle',
  name: '몸부림',
  type: 'neutral',
  category: 'physical',
  power: 40,
  accuracy: null,
  pp: 1,
  priority: 0,
  effects: [{ kind: 'recoil', ratio: 0.25 }],
  description: '쓸 수 있는 기술이 없을 때 발버둥 친다.',
};

export const MOVES: Record<string, MoveData> = Object.fromEntries(LIST.map((m) => [m.id, m]));

export function getMove(id: string): MoveData {
  const move = id === STRUGGLE.id ? STRUGGLE : MOVES[id];
  if (!move) throw new Error(`unknown move: ${id}`);
  return move;
}
