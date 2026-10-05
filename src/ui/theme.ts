import type { ElementType } from '../core/types';

export const WIDTH = 960;
export const HEIGHT = 540;

export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export const COLORS = {
  bg: 0x1b2130,
  panel: 0x283044,
  panelHover: 0x34405a,
  border: 0x5b6a8c,
  accent: 0xf2b84b,
  text: '#f2f4f8',
  dim: '#9aa3b5',
  gold: '#f2b84b',
  hpHigh: 0x4cd964,
  hpMid: 0xffcc00,
  hpLow: 0xff453a,
  exp: 0x5ac8fa,
};

export const TYPE_COLORS: Record<ElementType, number> = {
  neutral: 0xa8a29e,
  blaze: 0xf97316,
  tide: 0x3b82f6,
  verdant: 0x22c55e,
  volt: 0xeab308,
  stone: 0x92724b,
  gale: 0x7dd3fc,
  shade: 0x6d28d9,
  lumen: 0xf9a8d4,
};

export function hpColor(ratio: number): number {
  if (ratio > 0.5) return COLORS.hpHigh;
  if (ratio > 0.2) return COLORS.hpMid;
  return COLORS.hpLow;
}
