import Phaser from 'phaser';
import { hasSavedRun, resumeRun } from '../session';
import { COLORS, HEIGHT, WIDTH } from '../ui/theme';
import { addText, Button } from '../ui/widgets';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create(): void {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);
    addText(this, WIDTH / 2, 150, 'NIKKE ROGUE', 56, COLORS.gold).setOrigin(0.5);
    addText(this, WIDTH / 2, 210, '(가제) · 프로토타입', 18, COLORS.dim).setOrigin(0.5);

    new Button(this, {
      x: WIDTH / 2 - 130, y: 290, w: 260, h: 56, label: '새 게임', fontSize: 22,
      onClick: () => this.scene.start('starter'),
    });
    new Button(this, {
      x: WIDTH / 2 - 130, y: 362, w: 260, h: 56, label: '이어하기', fontSize: 22,
      enabled: hasSavedRun(),
      onClick: () => {
        if (resumeRun()) this.scene.start('battle');
      },
    });
  }
}
