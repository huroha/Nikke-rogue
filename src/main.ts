import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ProgressScene } from './scenes/ProgressScene';
import { RewardScene } from './scenes/RewardScene';
import { StarterScene } from './scenes/StarterScene';
import { TitleScene } from './scenes/TitleScene';
import { COLORS, HEIGHT, WIDTH } from './ui/theme';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: COLORS.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, StarterScene, BattleScene, ProgressScene, RewardScene, GameOverScene],
});

// 브라우저 콘솔/자동 테스트에서 상태를 들여다볼 수 있게 노출한다.
(window as unknown as { __game: Phaser.Game }).__game = game;
