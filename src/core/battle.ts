import { chooseEnemyMove } from './ai';
import { captureChance } from './balance';
import { computeDamage, stageMultiplier } from './damage';
import { getMove, STRUGGLE } from './data/moves';
import { getSpecies } from './data/species';
import { calcStats, displayName, healHp, maxHp } from './monster';
import type { Rng } from './rng';
import { josa } from './text';
import type { MonsterInstance, MoveData, StageStat, Stages } from './types';

export type Side = 'player' | 'enemy';
export type BattleOutcome = 'win' | 'lose' | 'captured';

export type BattleAction =
  | { kind: 'move'; moveIndex: number }
  | { kind: 'switch'; partyIndex: number }
  | { kind: 'capture' };

/** UI가 순서대로 연출할 이벤트. 상태는 이미 반영된 뒤에 나온다. */
export type BattleEvent =
  | { type: 'message'; text: string }
  | { type: 'attack'; side: Side; moveId: string }
  | { type: 'hp'; side: Side; hp: number; maxHp: number }
  | { type: 'faint'; side: Side }
  | { type: 'switch'; side: Side; partyIndex: number }
  | { type: 'capture'; success: boolean; shakes: number }
  | { type: 'end'; outcome: BattleOutcome };

export interface BattleOptions {
  capturable: boolean;
  isBoss: boolean;
}

const STAT_NAMES: Record<StageStat, string> = {
  atk: '공격',
  def: '방어',
  spa: '특수공격',
  spd: '특수방어',
  spe: '스피드',
};

function emptyStages(): Stages {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}

function other(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

/** 1:1 야생 전투. party는 런의 파티 배열을 그대로 참조해서 HP/PP 변화가 런에 반영된다. */
export class Battle {
  playerIndex: number;
  outcome: BattleOutcome | null = null;
  /** 플레이어 몬스터가 쓰러져서 교체를 골라야 하는 상태 */
  needsSwitch = false;
  /** 전투에 한 번이라도 나온 플레이어 몬스터 (경험치 분배용) */
  readonly participants = new Set<string>();
  private readonly stages: Record<Side, Stages> = { player: emptyStages(), enemy: emptyStages() };

  constructor(
    readonly party: MonsterInstance[],
    readonly enemy: MonsterInstance,
    private readonly rng: Rng,
    readonly options: BattleOptions,
  ) {
    this.playerIndex = party.findIndex((m) => m.hp > 0);
    if (this.playerIndex < 0) throw new Error('no usable monster in party');
    this.participants.add(this.playerActive.uid);
  }

  get playerActive(): MonsterInstance {
    return this.party[this.playerIndex];
  }

  monOf(side: Side): MonsterInstance {
    return side === 'player' ? this.playerActive : this.enemy;
  }

  nameOf(side: Side): string {
    const name = displayName(this.monOf(side));
    if (side === 'player') return name;
    return `${this.options.isBoss ? '보스' : '야생'} ${name}`;
  }

  stagesOf(side: Side): Readonly<Stages> {
    return this.stages[side];
  }

  canSwitchTo(index: number): boolean {
    const mon = this.party[index];
    return index !== this.playerIndex && mon !== undefined && mon.hp > 0;
  }

  /** 행동 하나를 받아 한 턴을 진행하고 이벤트를 돌려준다. */
  submit(action: BattleAction): BattleEvent[] {
    if (this.outcome) throw new Error('battle is already over');
    const ev: BattleEvent[] = [];

    if (this.needsSwitch) {
      if (action.kind !== 'switch' || !this.canSwitchTo(action.partyIndex)) {
        throw new Error('a fainted monster must be replaced first');
      }
      this.switchPlayer(action.partyIndex, ev);
      this.needsSwitch = false;
      return ev;
    }

    const enemyMove = chooseEnemyMove(this.enemy, this.playerActive, this.rng);

    switch (action.kind) {
      case 'switch':
        if (!this.canSwitchTo(action.partyIndex)) throw new Error(`cannot switch to ${action.partyIndex}`);
        this.switchPlayer(action.partyIndex, ev);
        this.useMove('enemy', enemyMove, ev);
        break;
      case 'capture':
        if (!this.options.capturable) throw new Error('this monster cannot be captured');
        if (!this.attemptCapture(ev)) this.useMove('enemy', enemyMove, ev);
        break;
      case 'move': {
        const slot = this.playerActive.moves[action.moveIndex];
        const hasPp = this.playerActive.moves.some((m) => m.pp > 0);
        if (hasPp && (!slot || slot.pp <= 0)) throw new Error(`move ${action.moveIndex} is not usable`);
        const order = this.turnOrder(this.resolveMove('player', action.moveIndex), this.resolveMove('enemy', enemyMove));
        for (const side of order) {
          if (this.outcome || this.needsSwitch || this.playerActive.hp <= 0 || this.enemy.hp <= 0) break;
          this.useMove(side, side === 'player' ? action.moveIndex : enemyMove, ev);
        }
        break;
      }
    }
    return ev;
  }

  private resolveMove(side: Side, index: number): MoveData {
    const mon = this.monOf(side);
    if (!mon.moves.some((m) => m.pp > 0)) return STRUGGLE;
    return getMove(mon.moves[index].id);
  }

  private effectiveSpeed(side: Side): number {
    return calcStats(this.monOf(side)).spe * stageMultiplier(this.stages[side].spe);
  }

  private turnOrder(playerMove: MoveData, enemyMove: MoveData): Side[] {
    if (playerMove.priority !== enemyMove.priority) {
      return playerMove.priority > enemyMove.priority ? ['player', 'enemy'] : ['enemy', 'player'];
    }
    const ps = this.effectiveSpeed('player');
    const es = this.effectiveSpeed('enemy');
    const playerFirst = ps === es ? this.rng.chance(0.5) : ps > es;
    return playerFirst ? ['player', 'enemy'] : ['enemy', 'player'];
  }

  private switchPlayer(index: number, ev: BattleEvent[]): void {
    if (this.playerActive.hp > 0) ev.push({ type: 'message', text: `돌아와, ${this.nameOf('player')}!` });
    this.playerIndex = index;
    this.stages.player = emptyStages();
    this.participants.add(this.playerActive.uid);
    ev.push({ type: 'switch', side: 'player', partyIndex: index });
    ev.push({ type: 'message', text: `가랏, ${this.nameOf('player')}!` });
  }

  private attemptCapture(ev: BattleEvent[]): boolean {
    const species = getSpecies(this.enemy.speciesId);
    const chance = captureChance(species.catchRate, this.enemy.hp, maxHp(this.enemy));
    ev.push({ type: 'message', text: '포획구를 던졌다!' });
    const success = this.rng.chance(chance);
    ev.push({ type: 'capture', success, shakes: success ? 3 : this.rng.int(0, 2) });
    if (!success) {
      ev.push({ type: 'message', text: '아깝다! 포획구에서 빠져나왔다!' });
      return false;
    }
    ev.push({ type: 'message', text: `${josa(displayName(this.enemy), '을', '를')} 붙잡았다!` });
    this.finish('captured', ev);
    return true;
  }

  private useMove(side: Side, index: number, ev: BattleEvent[]): void {
    const user = this.monOf(side);
    const foeSide = other(side);
    const target = this.monOf(foeSide);
    const move = this.resolveMove(side, index);
    if (move !== STRUGGLE) user.moves[index].pp -= 1;

    ev.push({ type: 'message', text: `${this.nameOf(side)}의 ${move.name}!` });
    if (move.accuracy !== null && this.rng.next() * 100 >= move.accuracy) {
      ev.push({ type: 'message', text: '하지만 빗나갔다!' });
      return;
    }

    if (move.category === 'status') {
      for (const effect of move.effects ?? []) {
        if (effect.kind === 'stage') this.applyStage(effect.target === 'self' ? side : foeSide, effect.stat, effect.stages, ev);
        if (effect.kind === 'heal') this.heal(side, maxHp(user) * effect.ratio, ev);
      }
      return;
    }

    ev.push({ type: 'attack', side, moveId: move.id });
    const result = computeDamage(user, target, move, this.stages[side], this.stages[foeSide], this.rng);
    if (result.effectiveness === 0) {
      ev.push({ type: 'message', text: `${this.nameOf(foeSide)}에게는 효과가 없는 것 같다…` });
      return;
    }
    const dealt = Math.min(target.hp, result.damage);
    target.hp -= dealt;
    ev.push({ type: 'hp', side: foeSide, hp: target.hp, maxHp: maxHp(target) });
    if (result.critical) ev.push({ type: 'message', text: '급소에 맞았다!' });
    if (result.effectiveness > 1) ev.push({ type: 'message', text: '효과가 뛰어나다!' });
    if (result.effectiveness < 1) ev.push({ type: 'message', text: '효과가 별로인 듯하다…' });

    for (const effect of move.effects ?? []) {
      if (effect.kind === 'drain') this.heal(side, dealt * effect.ratio, ev);
      if (effect.kind === 'stage' && (effect.chance === undefined || this.rng.next() * 100 < effect.chance)) {
        const affected = effect.target === 'self' ? side : foeSide;
        if (this.monOf(affected).hp > 0) this.applyStage(affected, effect.stat, effect.stages, ev);
      }
      if (effect.kind === 'recoil') {
        const recoil = Math.min(user.hp, Math.max(1, Math.floor(dealt * effect.ratio)));
        user.hp -= recoil;
        ev.push({ type: 'hp', side, hp: user.hp, maxHp: maxHp(user) });
        ev.push({ type: 'message', text: `${josa(this.nameOf(side), '은', '는')} 반동으로 데미지를 입었다!` });
      }
    }

    if (target.hp <= 0) this.handleFaint(foeSide, ev);
    if (user.hp <= 0) this.handleFaint(side, ev);
  }

  private heal(side: Side, amount: number, ev: BattleEvent[]): void {
    const mon = this.monOf(side);
    const healed = healHp(mon, amount);
    if (healed <= 0) {
      ev.push({ type: 'message', text: `${this.nameOf(side)}의 체력은 이미 가득하다!` });
      return;
    }
    ev.push({ type: 'hp', side, hp: mon.hp, maxHp: maxHp(mon) });
    ev.push({ type: 'message', text: `${josa(this.nameOf(side), '은', '는')} 체력을 회복했다!` });
  }

  private applyStage(side: Side, stat: StageStat, delta: number, ev: BattleEvent[]): void {
    const stages = this.stages[side];
    const next = Math.max(-6, Math.min(6, stages[stat] + delta));
    const subject = `${this.nameOf(side)}의 ${josa(STAT_NAMES[stat], '이', '가')}`;
    if (next === stages[stat]) {
      ev.push({ type: 'message', text: `${subject} 더 이상 ${delta > 0 ? '오르지' : '떨어지지'} 않는다!` });
      return;
    }
    const sharp = Math.abs(next - stages[stat]) >= 2 ? '크게 ' : '';
    stages[stat] = next;
    ev.push({ type: 'message', text: `${subject} ${sharp}${delta > 0 ? '올랐다' : '떨어졌다'}!` });
  }

  private handleFaint(side: Side, ev: BattleEvent[]): void {
    ev.push({ type: 'faint', side });
    ev.push({ type: 'message', text: `${josa(this.nameOf(side), '은', '는')} 쓰러졌다!` });
    if (this.outcome) return;
    if (side === 'enemy') {
      this.finish('win', ev);
    } else if (this.party.some((m) => m.hp > 0)) {
      this.needsSwitch = true;
    } else {
      this.finish('lose', ev);
    }
  }

  private finish(outcome: BattleOutcome, ev: BattleEvent[]): void {
    this.outcome = outcome;
    this.needsSwitch = false;
    ev.push({ type: 'end', outcome });
  }
}
