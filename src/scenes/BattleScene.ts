import Phaser from 'phaser';
import { BALANCE } from '../core/balance';
import { Battle, type BattleAction, type BattleEvent, type Side } from '../core/battle';
import { getMove } from '../core/data/moves';
import { TYPE_NAMES } from '../core/data/typeChart';
import { displayName, maxHp } from '../core/monster';
import { finishBattle, generateEncounter } from '../core/run';
import { josa } from '../core/text';
import { endRun, persistRun, requireRun, session } from '../session';
import { COLORS, HEIGHT, TYPE_COLORS, WIDTH } from '../ui/theme';
import { addPanel, addText, Button, delay, drawMonster, MonsterPanel, waitAdvance } from '../ui/widgets';

const ENEMY_POS = { x: 700, y: 165, size: 140 };
const PLAYER_POS = { x: 250, y: 325, size: 160 };
const MENU_Y = 416;

export class BattleScene extends Phaser.Scene {
  private battle!: Battle;
  private sprites!: Record<Side, Phaser.GameObjects.Container>;
  private panels!: Record<Side, MonsterPanel>;
  private message!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Text;
  private menu: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('battle');
  }

  create(): void {
    const run = requireRun();
    persistRun();
    const { enemy, isBoss } = generateEncounter(run, session.rng);
    this.battle = new Battle(run.party, enemy, session.rng, { capturable: !isBoss, isBoss });

    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.bg).setOrigin(0);
    this.add.ellipse(ENEMY_POS.x, ENEMY_POS.y + 68, 260, 56, 0x2a3a34);
    this.add.ellipse(PLAYER_POS.x, PLAYER_POS.y + 78, 300, 64, 0x2a3a34);

    addText(this, WIDTH / 2, 14, `웨이브 ${run.wave}${isBoss ? '  ★ 보스' : ''}`, 20, isBoss ? COLORS.gold : COLORS.text).setOrigin(0.5, 0);
    this.hud = addText(this, WIDTH - 20, 14, '', 16, COLORS.dim).setOrigin(1, 0);
    this.updateHud();

    this.sprites = {
      enemy: drawMonster(this, ENEMY_POS.x, ENEMY_POS.y, enemy.speciesId, ENEMY_POS.size),
      player: drawMonster(this, PLAYER_POS.x, PLAYER_POS.y, this.battle.playerActive.speciesId, PLAYER_POS.size),
    };
    this.panels = {
      enemy: new MonsterPanel(this, 40, 44, false),
      player: new MonsterPanel(this, 560, 250, true),
    };
    this.refreshPanel('enemy');
    this.refreshPanel('player');

    addPanel(this, 16, MENU_Y, WIDTH - 32, 108);
    this.message = addText(this, 36, MENU_Y + 18, '', 19).setWordWrapWidth(520);

    void this.intro();
  }

  private async intro(): Promise<void> {
    await this.play([
      { type: 'message', text: `${josa(this.battle.nameOf('enemy'), '이', '가')} 나타났다!` },
      { type: 'message', text: `가랏, ${this.battle.nameOf('player')}!` },
    ]);
    this.showRoot();
  }

  private updateHud(): void {
    const run = requireRun();
    this.hud.setText(`포획구 ${run.balls}  ·  동료 ${run.party.length}/${BALANCE.partyMax}`);
  }

  private refreshPanel(side: Side): void {
    this.panels[side].show(this.battle.monOf(side), side === 'enemy' && this.battle.options.isBoss ? '★ ' : '');
  }

  // ── 메뉴 ──────────────────────────────────────────────

  private clearMenu(): void {
    for (const obj of this.menu) obj.destroy();
    this.menu = [];
  }

  private showRoot(): void {
    this.clearMenu();
    const run = requireRun();
    const b = this.battle;
    this.message.setText(`${josa(b.nameOf('player'), '은', '는')} 무엇을 할까?`);
    const canSwitch = b.party.some((_, i) => b.canSwitchTo(i));
    const canCapture = b.options.capturable && run.balls > 0 && run.party.length < BALANCE.partyMax;
    const captureSub = !b.options.capturable
      ? '보스는 잡을 수 없다'
      : run.party.length >= BALANCE.partyMax
        ? '동료가 가득 찼다'
        : `남은 포획구 ${run.balls}`;

    this.menu.push(
      new Button(this, { x: 592, y: MENU_Y + 6, w: 346, h: 46, label: '싸우기', fontSize: 20, onClick: () => this.showMoves() }),
      new Button(this, { x: 592, y: MENU_Y + 58, w: 170, h: 46, label: '교체', enabled: canSwitch, onClick: () => this.showParty(false) }),
      new Button(this, {
        x: 768, y: MENU_Y + 58, w: 170, h: 46, label: '포획', sub: captureSub, enabled: canCapture,
        onClick: () => void this.act({ kind: 'capture' }),
      }),
    );
  }

  private showMoves(): void {
    this.clearMenu();
    this.message.setText('');
    const mon = this.battle.playerActive;
    const outOfPp = mon.moves.every((m) => m.pp <= 0);
    this.menu.push(this.add.rectangle(16, MENU_Y, WIDTH - 32, 108, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.border));

    mon.moves.forEach((slot, i) => {
      const move = getMove(slot.id);
      const power = move.category === 'status' ? '변화' : `위력 ${move.power}`;
      this.menu.push(
        new Button(this, {
          x: 24 + (i % 2) * 362, y: MENU_Y + 6 + Math.floor(i / 2) * 50, w: 356, h: 46,
          label: move.name, sub: `${TYPE_NAMES[move.type]} · ${power} · PP ${slot.pp}/${move.pp}`,
          stripe: TYPE_COLORS[move.type],
          enabled: slot.pp > 0 || outOfPp,
          onClick: () => void this.act({ kind: 'move', moveIndex: i }),
        }),
      );
    });
    this.menu.push(new Button(this, { x: 756, y: MENU_Y + 6, w: 180, h: 96, label: '뒤로', onClick: () => this.showRoot() }));
  }

  /** forced: 쓰러져서 반드시 교체해야 하는 경우 (취소 불가) */
  private showParty(forced: boolean): void {
    this.clearMenu();
    const b = this.battle;
    this.menu.push(this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.65).setOrigin(0).setInteractive());
    this.menu.push(addText(this, WIDTH / 2, 40, forced ? '다음으로 내보낼 동료를 고르세요' : '교체할 동료를 고르세요', 22).setOrigin(0.5));

    b.party.forEach((mon, i) => {
      const max = maxHp(mon);
      const state = i === b.playerIndex ? ' (전투 중)' : mon.hp <= 0 ? ' (기절)' : '';
      this.menu.push(
        new Button(this, {
          x: 90 + (i % 2) * 400, y: 80 + Math.floor(i / 2) * 110, w: 380, h: 96,
          label: `${displayName(mon)}  Lv.${mon.level}${state}`,
          sub: `HP ${mon.hp} / ${max}`,
          enabled: b.canSwitchTo(i),
          onClick: () => void this.act({ kind: 'switch', partyIndex: i }),
        }),
      );
    });
    if (!forced) {
      this.menu.push(new Button(this, { x: WIDTH / 2 - 100, y: 418, w: 200, h: 48, label: '취소', onClick: () => this.showRoot() }));
    }
  }

  // ── 턴 진행 ──────────────────────────────────────────

  private async act(action: BattleAction): Promise<void> {
    this.clearMenu();
    if (action.kind === 'capture') {
      requireRun().balls -= 1;
      this.updateHud();
    }
    await this.play(this.battle.submit(action));

    const b = this.battle;
    if (b.outcome) return this.onBattleEnd();
    if (b.needsSwitch) return this.showParty(true);
    this.showRoot();
  }

  private async onBattleEnd(): Promise<void> {
    const run = requireRun();
    await delay(this, 300);
    if (this.battle.outcome === 'lose') {
      endRun();
      this.scene.start('gameover', { wave: run.wave });
      return;
    }
    const steps = finishBattle(run, this.battle);
    this.scene.start('progress', { steps, next: 'reward' });
  }

  private async play(events: BattleEvent[]): Promise<void> {
    for (const e of events) {
      switch (e.type) {
        case 'message':
          this.message.setText(e.text);
          await waitAdvance(this, 900);
          break;
        case 'attack':
          await this.animateAttack(e.side);
          break;
        case 'hp':
          await this.panels[e.side].animateHp(e.hp, e.maxHp);
          break;
        case 'faint':
          await this.tween({ targets: this.sprites[e.side], y: '+=40', alpha: 0, duration: 400 });
          break;
        case 'switch':
          this.sprites.player.destroy();
          this.sprites.player = drawMonster(this, PLAYER_POS.x, PLAYER_POS.y, this.battle.playerActive.speciesId, PLAYER_POS.size);
          this.refreshPanel('player');
          break;
        case 'capture':
          await this.animateCapture(e.success, e.shakes);
          break;
        case 'end':
          break;
      }
    }
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...config, onComplete: () => resolve() }));
  }

  private async animateAttack(side: Side): Promise<void> {
    const dx = side === 'player' ? 30 : -30;
    await this.tween({ targets: this.sprites[side], x: `+=${dx}`, y: `${side === 'player' ? '-' : '+'}=12`, duration: 110, yoyo: true });
    const target = this.sprites[side === 'player' ? 'enemy' : 'player'];
    await this.tween({ targets: target, alpha: 0.2, duration: 70, yoyo: true, repeat: 1 });
  }

  private async animateCapture(success: boolean, shakes: number): Promise<void> {
    const enemy = this.sprites.enemy;
    const ball = this.add.container(PLAYER_POS.x, PLAYER_POS.y - 40);
    ball.add(this.add.circle(0, 0, 16, 0xe5484d).setStrokeStyle(3, 0x10131a));
    ball.add(this.add.rectangle(0, 0, 32, 4, 0x10131a));
    ball.add(this.add.circle(0, 0, 5, 0xffffff).setStrokeStyle(2, 0x10131a));

    await this.tween({ targets: ball, x: ENEMY_POS.x, y: ENEMY_POS.y + 40, duration: 450, ease: 'Quad.easeOut' });
    await this.tween({ targets: enemy, scale: 0.1, alpha: 0, duration: 250 });
    for (let i = 0; i < shakes; i++) {
      await delay(this, 250);
      await this.tween({ targets: ball, angle: 20, duration: 90, yoyo: true });
      await this.tween({ targets: ball, angle: -20, duration: 90, yoyo: true });
    }
    await delay(this, 250);
    if (success) {
      await this.tween({ targets: ball, alpha: 0.6, duration: 120, yoyo: true, repeat: 1 });
      return;
    }
    ball.destroy();
    await this.tween({ targets: enemy, scale: 1, alpha: 1, duration: 200 });
  }
}
