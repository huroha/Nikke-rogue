import Phaser from 'phaser';
import { COLORS, HEIGHT, WIDTH } from '../ui/theme';
import { addText, Button } from '../ui/widgets';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('gameover');
  }

  create(data: { wave: number }): void {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);
    addText(this, WIDTH / 2, 170, '전멸했다…', 44, '#ff6b5e').setOrigin(0.5);
    addText(this, WIDTH / 2, 240, `도달한 웨이브: ${data.wave}`, 22).setOrigin(0.5);
    new Button(this, {
      x: WIDTH / 2 - 120, y: 320, w: 240, h: 54, label: '타이틀로', fontSize: 20,
      onClick: () => this.scene.start('title'),
    });
  }
}
