import Phaser from 'phaser';
import { getMove } from '../core/data/moves';
import { TYPE_NAMES } from '../core/data/typeChart';
import { displayName, evolve, learnMove } from '../core/monster';
import { josa } from '../core/text';
import type { MonsterInstance, ProgressStep } from '../core/types';
import { requireRun } from '../session';
import { COLORS, HEIGHT, TYPE_COLORS, WIDTH } from '../ui/theme';
import { addPanel, addText, Button, delay, drawMonster, waitAdvance } from '../ui/widgets';

export interface ProgressData {
  steps: ProgressStep[];
  next: 'reward' | 'battle';
}

/** 경험치/레벨업/기술 습득/진화 메시지를 차례로 보여준다. */
export class ProgressScene extends Phaser.Scene {
  private message!: Phaser.GameObjects.Text;
  private sprite: Phaser.GameObjects.Container | null = null;
  private choice: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('progress');
  }

  create(data: ProgressData): void {
    this.sprite = null;
    this.choice = [];
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);
    addPanel(this, 16, 416, WIDTH - 32, 108);
    this.message = addText(this, 36, 434, '', 19).setWordWrapWidth(880);
    void this.run(data);
  }

  private async run(data: ProgressData): Promise<void> {
    const party = requireRun().party;
    for (const step of data.steps) {
      if (step.kind === 'message') {
        await this.say(step.text);
        continue;
      }
      const mon = party.find((m) => m.uid === step.uid);
      if (!mon) continue;
      this.showSprite(mon);
      if (step.kind === 'learn') await this.learn(mon, step.moveId);
      else await this.evolve(mon, step.into);
    }
    this.scene.start(data.next);
  }

  private async say(text: string, ms = 1100): Promise<void> {
    this.message.setText(text);
    await waitAdvance(this, ms);
  }

  private showSprite(mon: MonsterInstance): void {
    this.sprite?.destroy();
    this.sprite = drawMonster(this, WIDTH / 2, 190, mon.speciesId, 160);
  }

  private async learn(mon: MonsterInstance, moveId: string): Promise<void> {
    const name = displayName(mon);
    const move = getMove(moveId);
    this.message.setText(
      `${josa(name, '은', '는')} ${josa(move.name, '을', '를')} 배우려 한다! 하지만 기술이 4개라 더 배울 수 없다.\n` +
        `어떤 기술을 잊을까? (새 기술: ${TYPE_NAMES[move.type]} · ${move.category === 'status' ? '변화' : `위력 ${move.power}`} · ${move.description})`,
    );

    const picked = await new Promise<number | null>((resolve) => {
      mon.moves.forEach((slot, i) => {
        const m = getMove(slot.id);
        this.choice.push(
          new Button(this, {
            x: 60 + (i % 2) * 290, y: 290 + Math.floor(i / 2) * 58, w: 280, h: 50,
            label: m.name, sub: `${TYPE_NAMES[m.type]} · ${m.category === 'status' ? '변화' : `위력 ${m.power}`}`,
            stripe: TYPE_COLORS[m.type],
            onClick: () => resolve(i),
          }),
        );
      });
      this.choice.push(new Button(this, { x: 650, y: 290, w: 250, h: 108, label: '배우지 않는다', onClick: () => resolve(null) }));
    });

    for (const obj of this.choice) obj.destroy();
    this.choice = [];
    await this.say(learnMove(mon, moveId, picked));
  }

  private async evolve(mon: MonsterInstance, into: string): Promise<void> {
    await this.say(`어라…? ${displayName(mon)}의 모습이…!`);
    if (this.sprite) {
      await new Promise<void>((resolve) =>
        this.tweens.add({ targets: this.sprite, alpha: 0.1, duration: 150, yoyo: true, repeat: 4, onComplete: () => resolve() }),
      );
    }
    const text = evolve(mon, into);
    this.showSprite(mon);
    await delay(this, 200);
    await this.say(text, 1600);
  }
}
