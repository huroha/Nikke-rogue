import Phaser from 'phaser';
import { expForLevel } from '../core/balance';
import { getSpecies } from '../core/data/species';
import { TYPE_NAMES } from '../core/data/typeChart';
import { displayName, maxHp } from '../core/monster';
import type { ElementType, MonsterInstance } from '../core/types';
import { COLORS, FONT, TYPE_COLORS, hpColor } from './theme';

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  size = 18,
  color = COLORS.text,
): Phaser.GameObjects.Text {
  // 화면 배율이 커져도 글자가 흐려지지 않도록 고해상도로 그린다.
  const resolution = Math.max(2, window.devicePixelRatio || 1);
  return scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution });
}

export function addPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, w, h, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.border);
}

export interface ButtonOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  fill?: number;
  /** 왼쪽 세로 띠 색 (기술 타입 표시 등) */
  stripe?: number;
  fontSize?: number;
  enabled?: boolean;
  onClick: () => void;
}

export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private enabled = true;

  constructor(scene: Phaser.Scene, opts: ButtonOptions) {
    super(scene, opts.x, opts.y);
    const fill = opts.fill ?? COLORS.panel;
    this.bg = scene.add.rectangle(0, 0, opts.w, opts.h, fill).setOrigin(0).setStrokeStyle(2, COLORS.border);
    this.add(this.bg);
    if (opts.stripe !== undefined) this.add(scene.add.rectangle(0, 0, 8, opts.h, opts.stripe).setOrigin(0));
    const labelY = opts.sub ? opts.h / 2 - 10 : opts.h / 2;
    this.add(
      addText(scene, opts.w / 2, labelY, opts.label, opts.fontSize ?? 18).setOrigin(0.5),
    );
    if (opts.sub) {
      const sub = addText(scene, opts.w / 2, opts.h / 2 + 13, opts.sub, 13, COLORS.dim).setOrigin(0.5);
      sub.setWordWrapWidth(opts.w - 24).setAlign('center');
      this.add(sub);
    }

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerover', () => this.enabled && this.bg.setStrokeStyle(2, COLORS.accent));
    this.bg.on('pointerout', () => this.bg.setStrokeStyle(2, COLORS.border));
    this.bg.on('pointerup', () => this.enabled && opts.onClick());
    this.setEnabled(opts.enabled ?? true);
    scene.add.existing(this);
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.35);
    return this;
  }
}

export function typeBadge(scene: Phaser.Scene, x: number, y: number, type: ElementType): Phaser.GameObjects.Container {
  const w = 54;
  const c = scene.add.container(x, y);
  c.add(scene.add.rectangle(0, 0, w, 20, TYPE_COLORS[type]).setOrigin(0));
  c.add(addText(scene, w / 2, 10, TYPE_NAMES[type], 12, '#10131a').setOrigin(0.5));
  return c;
}

/**
 * 몬스터 그림. src/assets/monsters/{종족id}.png 가 있으면 그 이미지를, 없으면 타입 색 도형을 그린다.
 */
export function drawMonster(scene: Phaser.Scene, x: number, y: number, speciesId: string, size: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const key = `mon-${speciesId}`;
  if (scene.textures.exists(key)) {
    const img = scene.add.image(0, 0, key);
    img.setScale(size / Math.max(img.width, img.height));
    c.add(img);
    return c;
  }
  const species = getSpecies(speciesId);
  const [t1, t2] = species.types;
  c.add(scene.add.rectangle(0, 0, size, size, TYPE_COLORS[t1]).setStrokeStyle(3, 0x0b0e14));
  if (t2) c.add(scene.add.rectangle(0, size * 0.3, size - 6, size * 0.34, TYPE_COLORS[t2]));
  c.add(addText(scene, 0, -size * 0.08, species.name.slice(0, 1), Math.floor(size * 0.42), '#10131a').setOrigin(0.5));
  return c;
}

export class Bar extends Phaser.GameObjects.Container {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private ratio = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly barWidth: number, h: number, private readonly color?: number) {
    super(scene, x, y);
    this.add(scene.add.rectangle(0, 0, barWidth, h, 0x10131a).setOrigin(0));
    this.fill = scene.add.rectangle(0, 0, barWidth, h, color ?? COLORS.hpHigh).setOrigin(0);
    this.add(this.fill);
    scene.add.existing(this);
  }

  setRatio(ratio: number, animate = false): Promise<void> {
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    const apply = (v: number) => {
      this.fill.width = this.barWidth * v;
      if (this.color === undefined) this.fill.fillColor = hpColor(v);
    };
    if (!animate) {
      this.ratio = r;
      apply(r);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const from = this.ratio;
      this.ratio = r;
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 450,
        onUpdate: (tw) => apply(from + (r - from) * (tw.getValue() ?? 1)),
        onComplete: () => resolve(),
      });
    });
  }
}

/** 이름/레벨/타입/HP(/EXP) 패널 */
export class MonsterPanel extends Phaser.GameObjects.Container {
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text | null;
  private readonly hpBar: Bar;
  private readonly expBar: Bar | null;
  private badges: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, detailed: boolean) {
    super(scene, x, y);
    const h = detailed ? 104 : 80;
    this.add(addPanel(scene, 0, 0, 360, h));
    this.nameText = addText(scene, 14, 10, '', 20);
    this.add(this.nameText);
    this.add(addText(scene, 14, 47, 'HP', 14, COLORS.gold));
    this.hpBar = new Bar(scene, 44, 50, 300, 12);
    this.add(this.hpBar);
    this.hpText = detailed ? addText(scene, 344, 64, '', 14).setOrigin(1, 0) : null;
    if (this.hpText) this.add(this.hpText);
    this.expBar = detailed ? new Bar(scene, 14, 90, 330, 5, COLORS.exp) : null;
    if (this.expBar) this.add(this.expBar);
    scene.add.existing(this);
  }

  show(mon: MonsterInstance, prefix = ''): void {
    const max = maxHp(mon);
    this.nameText.setText(`${prefix}${displayName(mon)}  Lv.${mon.level}`);
    this.hpBar.setRatio(mon.hp / max);
    this.hpText?.setText(`${mon.hp} / ${max}`);
    if (this.expBar) {
      const lo = expForLevel(mon.level);
      const hi = expForLevel(mon.level + 1);
      this.expBar.setRatio(hi > lo ? (mon.exp - lo) / (hi - lo) : 1);
    }
    for (const b of this.badges) b.destroy();
    this.badges = getSpecies(mon.speciesId).types.map((t, i) => typeBadge(this.scene, 222 + i * 60, 12, t));
    for (const b of this.badges) this.add(b);
  }

  async animateHp(hp: number, max: number): Promise<void> {
    this.hpText?.setText(`${hp} / ${max}`);
    await this.hpBar.setRatio(hp / max, true);
  }
}

export function delay(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}

/** ms가 지나거나 화면을 클릭/키 입력하면 넘어간다. */
export function waitAdvance(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      timer.remove();
      scene.input.off('pointerdown', finish);
      scene.input.keyboard?.off('keydown', finish);
      resolve();
    };
    const timer = scene.time.delayedCall(ms, finish);
    scene.input.once('pointerdown', finish);
    scene.input.keyboard?.once('keydown', finish);
  });
}
