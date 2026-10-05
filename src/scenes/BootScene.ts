import Phaser from 'phaser';

/** src/assets/monsters/{종족id}.png 파일을 자동으로 찾아서 불러온다. 없는 종족은 도형으로 그려진다. */
const monsterSprites = import.meta.glob('../assets/monsters/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function spriteKey(path: string): string {
  const file = path.split('/').pop() ?? path;
  return `mon-${file.replace(/\.png$/, '')}`;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const [path, url] of Object.entries(monsterSprites)) this.load.image(spriteKey(path), url);
  }

  create(): void {
    // 도트 그림은 확대해도 번지지 않게 최근접 필터를 쓴다.
    for (const path of Object.keys(monsterSprites)) {
      this.textures.get(spriteKey(path)).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.scene.start('title');
  }
}
