import Phaser from 'phaser';
import { displayName, maxHp } from '../core/monster';
import { rollRewards, type RewardDef } from '../core/rewards';
import { isBossWave } from '../core/run';
import { requireRun, session } from '../session';
import { COLORS, HEIGHT, WIDTH } from '../ui/theme';
import { addPanel, addText, Bar, Button, drawMonster } from '../ui/widgets';

export class RewardScene extends Phaser.Scene {
  constructor() {
    super('reward');
  }

  create(): void {
    const run = requireRun();
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);
    addText(this, WIDTH / 2, 36, `웨이브 ${run.wave - 1} 클리어!`, 28, COLORS.gold).setOrigin(0.5);
    const next = isBossWave(run.wave) ? `다음: 웨이브 ${run.wave} (★ 보스)` : `다음: 웨이브 ${run.wave}`;
    addText(this, WIDTH / 2, 74, `보상을 하나 고르세요 · ${next}`, 16, COLORS.dim).setOrigin(0.5);

    rollRewards(run, session.rng).forEach((reward, i) => {
      new Button(this, {
        x: 50 + i * 295, y: 110, w: 270, h: 180, label: reward.name, sub: reward.description, fontSize: 22,
        onClick: () => this.pick(reward),
      });
    });

    addText(this, 30, 318, `동료  ·  포획구 ${run.balls}`, 16, COLORS.dim);
    run.party.forEach((mon, i) => {
      const x = 30 + i * 152;
      const y = 345;
      addPanel(this, x, y, 144, 170);
      drawMonster(this, x + 72, y + 52, mon.speciesId, 70).setAlpha(mon.hp > 0 ? 1 : 0.35);
      addText(this, x + 72, y + 100, displayName(mon), 15).setOrigin(0.5, 0);
      addText(this, x + 72, y + 122, `Lv.${mon.level}`, 13, COLORS.dim).setOrigin(0.5, 0);
      new Bar(this, x + 12, y + 146, 120, 8).setRatio(mon.hp / maxHp(mon));
    });
  }

  private pick(reward: RewardDef): void {
    const steps = reward.apply(requireRun());
    this.scene.start('progress', { steps, next: 'battle' });
  }
}
