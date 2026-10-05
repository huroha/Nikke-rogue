import { describe, expect, it } from 'vitest';
import { expForLevel } from '../src/core/balance';
import { Battle } from '../src/core/battle';
import { computeDamage } from '../src/core/damage';
import { MOVES } from '../src/core/data/moves';
import { SPECIES, STARTERS } from '../src/core/data/species';
import { typeEffectiveness } from '../src/core/data/typeChart';
import { createMonster, evolve, gainExp, learnMove, maxHp } from '../src/core/monster';
import { REWARDS, rollRewards } from '../src/core/rewards';
import { Rng } from '../src/core/rng';
import { createRun, finishBattle, generateEncounter } from '../src/core/run';
import { josa, josaRo } from '../src/core/text';
import type { Stages } from '../src/core/types';

const zero = (): Stages => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

describe('data integrity', () => {
  it('every learnset move and evolution target exists', () => {
    for (const s of Object.values(SPECIES)) {
      for (const e of s.learnset) expect(MOVES[e.move], `${s.id} → ${e.move}`).toBeDefined();
      if (s.evolution) expect(SPECIES[s.evolution.into]).toBeDefined();
    }
    for (const id of STARTERS) expect(SPECIES[id]).toBeDefined();
  });
});

describe('rng', () => {
  it('is deterministic for a seed and restorable from state', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
    const c = new Rng(0);
    c.state = a.state;
    expect(c.next()).toBe(a.next());
  });
});

describe('type chart', () => {
  it('multiplies dual types and handles immunity', () => {
    expect(typeEffectiveness('tide', ['blaze'])).toBe(2);
    expect(typeEffectiveness('tide', ['stone', 'blaze'])).toBe(4);
    expect(typeEffectiveness('volt', ['stone'])).toBe(0);
    expect(typeEffectiveness('neutral', ['shade'])).toBe(1);
  });
});

describe('monster', () => {
  it('creates with the last four learnable moves and full HP', () => {
    const m = createMonster('cindle', 30, 'x');
    expect(m.moves.map((s) => s.id)).toEqual(['quick-jab', 'flame-dash', 'fighting-spirit', 'scorch-cannon']);
    expect(m.hp).toBe(maxHp(m));
  });

  it('levels up, learns moves and queues evolution', () => {
    const m = createMonster('cindle', 4, 'x');
    const steps = gainExp(m, expForLevel(16) - m.exp);
    expect(m.level).toBe(16);
    expect(m.moves.map((s) => s.id)).toEqual(['bump', 'snarl', 'cinder', 'quick-jab']);
    expect(steps).toContainEqual({ kind: 'learn', uid: 'x', moveId: 'flame-dash' });
    expect(steps.at(-1)).toEqual({ kind: 'evolve', uid: 'x', into: 'pyrrox' });
    const missing = maxHp(m) - m.hp;
    evolve(m, 'pyrrox');
    expect(m.speciesId).toBe('pyrrox');
    expect(maxHp(m) - m.hp).toBe(missing);
  });

  it('asks to replace when four moves are known', () => {
    const m = createMonster('cindle', 19, 'x');
    expect(m.moves).toHaveLength(4);
    const steps = gainExp(m, expForLevel(20) - m.exp);
    expect(steps).toContainEqual({ kind: 'learn', uid: 'x', moveId: 'fighting-spirit' });
    learnMove(m, 'fighting-spirit', 0);
    expect(m.moves[0].id).toBe('fighting-spirit');
  });
});

describe('damage', () => {
  it('scales with type effectiveness and is zero on immunity', () => {
    const atk = createMonster('drople', 20, 'a');
    const fire = createMonster('cindle', 20, 'b');
    const grass = createMonster('sproutle', 20, 'c');
    const avg = (def: typeof fire) => {
      const rng = new Rng(7);
      let sum = 0;
      for (let i = 0; i < 200; i++) sum += computeDamage(atk, def, MOVES['spray'], zero(), zero(), rng).damage;
      return sum / 200;
    };
    expect(avg(fire)).toBeGreaterThan(avg(grass) * 2.5);
    const zap = createMonster('zapple', 20, 'd');
    const rock = createMonster('pebblit', 20, 'e');
    expect(computeDamage(zap, rock, MOVES['jolt'], zero(), zero(), new Rng(1)).damage).toBe(0);
  });
});

describe('battle', () => {
  it('runs to a conclusion and spends PP', () => {
    const party = [createMonster('drople', 15, 'p')];
    const enemy = createMonster('cindle', 5, 'e');
    const battle = new Battle(party, enemy, new Rng(3), { capturable: true, isBoss: false });
    let turns = 0;
    while (!battle.outcome && turns++ < 50) battle.submit({ kind: 'move', moveIndex: 1 });
    expect(battle.outcome).toBe('win');
    expect(enemy.hp).toBe(0);
    expect(party[0].moves[1].pp).toBeLessThan(MOVES[party[0].moves[1].id].pp);
  });

  it('forces a switch when the active monster faints, then loses when all faint', () => {
    const party = [createMonster('nubbit', 2, 'p1'), createMonster('nubbit', 2, 'p2')];
    const enemy = createMonster('pyrrox', 50, 'e');
    const battle = new Battle(party, enemy, new Rng(9), { capturable: false, isBoss: true });
    for (let i = 0; i < 20 && !battle.needsSwitch; i++) battle.submit({ kind: 'move', moveIndex: 0 });
    expect(battle.needsSwitch).toBe(true);
    expect(() => battle.submit({ kind: 'move', moveIndex: 0 })).toThrow();
    battle.submit({ kind: 'switch', partyIndex: 1 });
    expect(battle.playerIndex).toBe(1);
    for (let i = 0; i < 20 && !battle.outcome; i++) battle.submit({ kind: 'move', moveIndex: 0 });
    expect(battle.outcome).toBe('lose');
  });

  it('rejects capture in boss battles', () => {
    const battle = new Battle([createMonster('drople', 10, 'p')], createMonster('nubbit', 5, 'e'), new Rng(1), {
      capturable: false,
      isBoss: true,
    });
    expect(() => battle.submit({ kind: 'capture' })).toThrow();
  });

  it('uses struggle when out of PP', () => {
    const party = [createMonster('drople', 30, 'p')];
    for (const s of party[0].moves) s.pp = 0;
    const battle = new Battle(party, createMonster('nubbit', 2, 'e'), new Rng(5), { capturable: true, isBoss: false });
    const events = battle.submit({ kind: 'move', moveIndex: 0 });
    expect(events.some((e) => e.type === 'message' && e.text.includes('몸부림'))).toBe(true);
  });
});

describe('run', () => {
  it('generates bosses on boss waves and grants exp after a win', () => {
    const rng = new Rng(11);
    const run = createRun('sproutle', 11);
    run.wave = 10;
    const { enemy, isBoss } = generateEncounter(run, rng);
    expect(isBoss).toBe(true);
    expect(SPECIES[enemy.speciesId].evolution).toBeUndefined();

    run.wave = 1;
    const battle = new Battle(run.party, generateEncounter(run, rng).enemy, rng, { capturable: true, isBoss: false });
    battle.enemy.hp = 0;
    battle.outcome = 'win';
    const before = run.party[0].exp;
    finishBattle(run, battle);
    expect(run.wave).toBe(2);
    expect(run.party[0].exp).toBeGreaterThan(before);
  });

  it('adds captured monsters to the party', () => {
    const rng = new Rng(2);
    const run = createRun('drople', 2);
    const battle = new Battle(run.party, generateEncounter(run, rng).enemy, rng, { capturable: true, isBoss: false });
    battle.outcome = 'captured';
    finishBattle(run, battle);
    expect(run.party).toHaveLength(2);
  });

  it('rolls distinct, applicable rewards', () => {
    const run = createRun('cindle', 1);
    const picks = rollRewards(run, new Rng(4));
    expect(new Set(picks.map((r) => r.id)).size).toBe(picks.length);
    expect(picks.some((r) => r.id === 'phoenix-feather')).toBe(false);
    run.party[0].hp = 0;
    expect(REWARDS.find((r) => r.id === 'phoenix-feather')!.weight(run)).toBeGreaterThan(0);
  });
});

describe('josa', () => {
  it('picks particles by final consonant', () => {
    expect(josa('불똥이', '은', '는')).toBe('불똥이는');
    expect(josa('그늘냥', '은', '는')).toBe('그늘냥은');
    expect(josaRo('불꽃갈기')).toBe('불꽃갈기로');
    expect(josaRo('해일뱀')).toBe('해일뱀으로');
    expect(josaRo('조약돌')).toBe('조약돌로');
  });
});
