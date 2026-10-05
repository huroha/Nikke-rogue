import Phaser from 'phaser';
import { BALANCE } from '../core/balance';
import { getMove } from '../core/data/moves';
import { getSpecies, STARTERS } from '../core/data/species';
import { createMonster } from '../core/monster';
import { josaRo } from '../core/text';
import { startNewRun } from '../session';
import { COLORS, HEIGHT, WIDTH } from '../ui/theme';
import { addText, Button, drawMonster, typeBadge } from '../ui/widgets';

export class StarterScene extends Phaser.Scene {
  constructor() {
    super('starter');
  }

  create(): void {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);
    addText(this, WIDTH / 2, 50, '함께할 첫 동료를 고르세요', 26).setOrigin(0.5);

    STARTERS.forEach((id, i) => {
      const species = getSpecies(id);
      const x = 60 + i * 290;
      const y = 100;
      new Button(this, { x, y, w: 260, h: 400, label: '', onClick: () => this.choose(id) });
      drawMonster(this, x + 130, y + 95, id, 120);
      addText(this, x + 130, y + 180, species.name, 24).setOrigin(0.5);
      species.types.forEach((t, j) => typeBadge(this, x + 130 - species.types.length * 30 + j * 60 + 3, y + 202, t));

      const b = species.base;
      const stats = `HP ${b.hp}  공격 ${b.atk}  방어 ${b.def}\n특공 ${b.spa}  특방 ${b.spd}  스피드 ${b.spe}`;
      addText(this, x + 130, y + 252, stats, 14, COLORS.dim).setOrigin(0.5).setAlign('center');

      const moves = createMonster(id, BALANCE.starterLevel, 'preview').moves.map((m) => getMove(m.id).name);
      addText(this, x + 130, y + 300, `기술: ${moves.join(', ')}`, 14).setOrigin(0.5, 0).setWordWrapWidth(230).setAlign('center');
      const evo = species.evolution;
      if (evo) addText(this, x + 130, y + 360, `Lv.${evo.level}에 ${josaRo(getSpecies(evo.into).name)} 진화`, 13, COLORS.gold).setOrigin(0.5);
    });
  }

  private choose(id: string): void {
    startNewRun(id);
    this.scene.start('battle');
  }
}
