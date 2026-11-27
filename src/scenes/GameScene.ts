import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { ASSET_KEYS } from '../config/assets';
import {
  getCharacter,
  type CharacterId,
} from '../config/characters';
import {
  ARENA_HALF,
  ARENA_SIZE,
  COLORS,
  MATCH_DURATION_MS,
  PLAYER,
} from '../config/constants';
import { boostProgress, loadMeta, recordRun } from '../config/meta';
import type { EnemyKind } from '../config/enemies';
import { Player } from '../entities/Player';
import { ArenaMap } from '../systems/ArenaMap';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FeedbackFX } from '../systems/FeedbackFX';
import { MilestoneDirector } from '../systems/MilestoneDirector';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpPool } from '../systems/XpPool';
import { Hud } from '../ui/Hud';
import { LevelUpUI } from '../ui/LevelUpUI';
import { ResultUI } from '../ui/ResultUI';
import { VirtualJoystick } from '../ui/VirtualJoystick';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: EnemySystem;
  private weapons!: WeaponSystem;
  private xpPool!: XpPool;
  private combat!: CombatSystem;
  private fx!: FeedbackFX;
  private arena!: ArenaMap;
  private milestones!: MilestoneDirector;
  private joystick!: VirtualJoystick;
  private hud!: Hud;
  private levelUpUI!: LevelUpUI;
  private resultUI!: ResultUI;

  private elapsedMs = 0;
  private ended = false;
  private magnetUntil = 0;
  private metaSnapshot = loadMeta();

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.elapsedMs = 0;
    this.ended = false;
    this.magnetUntil = 0;
    this.metaSnapshot = loadMeta();

    audioDirector.attach(this);
    audioDirector.unlock();
    audioDirector.playCombat();

    const characterId = (this.registry.get('selectedCharacter') as CharacterId) || 'knight';
    const character = getCharacter(characterId);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.drawArena();
    this.arena = new ArenaMap(this);

    this.player = new Player(this, character);
    this.player.setArena(this.arena);
    this.enemies = new EnemySystem(this);
    this.weapons = new WeaponSystem(this);
    this.xpPool = new XpPool(this);
    this.combat = new CombatSystem();
    this.fx = new FeedbackFX(this);
    this.milestones = new MilestoneDirector(this);
    this.joystick = new VirtualJoystick(this);
    this.hud = new Hud(this, character.name, !this.joystick.touchMode);
    this.levelUpUI = new LevelUpUI(this);
    this.resultUI = new ResultUI(this);

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setBounds(
      -ARENA_HALF - 40,
      -ARENA_HALF - 40,
      ARENA_SIZE + 80,
      ARENA_SIZE + 80,
    );

    for (let i = 0; i < 8; i += 1) {
      this.enemies.spawnKind('chaser', 0, 0, 280 + i * 36);
    }
    for (let i = 0; i < 4; i += 1) {
      this.enemies.spawnKind('swarm', 0, 0, 340 + i * 28);
    }
  }

  private drawArena(): void {
    const tileSize = 128;
    for (let x = -ARENA_HALF; x < ARENA_HALF; x += tileSize) {
      for (let y = -ARENA_HALF; y < ARENA_HALF; y += tileSize) {
        this.add
          .image(x + tileSize / 2, y + tileSize / 2, ASSET_KEYS.ground)
          .setDisplaySize(tileSize, tileSize)
          .setDepth(0)
          .setAlpha(0.95);
      }
    }

    const g = this.add.graphics().setDepth(1);
    g.lineStyle(3, 0x2d4066, 1);
    g.strokeRect(-ARENA_HALF, -ARENA_HALF, ARENA_SIZE, ARENA_SIZE);
    g.fillStyle(0x050814, 0.18);
    g.fillRect(-ARENA_HALF, -ARENA_HALF, ARENA_SIZE, ARENA_SIZE);
  }

  update(_time: number, delta: number): void {
    audioDirector.update(delta);
    if (this.ended) return;

    const time = this.time.now;
    if (this.joystick.touchMode) {
      this.joystick.enabled = !this.levelUpUI.isOpen;
      this.joystick.setVisible(!this.levelUpUI.isOpen);
    }

    const metaProg = boostProgress(
      this.metaSnapshot,
      this.player.character.id,
      this.elapsedMs,
      this.combat.kills,
    );

    if (this.levelUpUI.isOpen) {
      this.hud.update(
        this.player.stats,
        this.elapsedMs,
        this.combat.kills,
        this.enemies.aliveCount,
        metaProg,
      );
      return;
    }

    this.elapsedMs += delta;
    const stick = this.joystick.vector;
    this.player.setStick(stick.x, stick.y);
    this.player.update(time, delta);
    this.arena.update(time, delta, this.player);
    this.enemies.update(time, delta, this.elapsedMs, this.player);
    for (const enemy of this.enemies.enemies) {
      if (enemy.active) this.arena.resolveEnemy(enemy);
    }
    this.weapons.update(time, delta, this.player, this.enemies.enemies);
    this.milestones.update(this.elapsedMs, this.enemies, this.player, this.xpPool);

    this.combat.resolvePlayerProjectiles(
      time,
      this.weapons.projectiles,
      this.enemies.enemies,
      (x, y, value) => this.xpPool.spawn(x, y, value),
      (kind) => {
        this.pulseMagnet(time);
        audioDirector.playKill(kind);
      },
      this.fx,
    );

    this.flushSkillHits();
    this.flushSkillKills(this.weapons.pendingOrbitKills);
    this.flushSkillKills(this.weapons.pendingAuraKills);

    this.combat.resolveEnemyContact(time, this.player, this.enemies.enemies);
    this.combat.resolveEnemyBullets(time, this.player, this.enemies.bullets);

    const magnetBoost = time < this.magnetUntil;
    const gained = this.combat.collectXp(
      delta,
      this.player,
      this.xpPool.orbs,
      magnetBoost,
    );
    if (gained > 0) {
      const levels = this.player.stats.addXp(gained);
      if (levels > 0) {
        this.levelUpUI.queueLevels(
          levels,
          this.player.stats.stacks,
          (id) => this.player.stats.applyUpgrade(id),
          this.player.character.id,
        );
      }
    }

    audioDirector.setCombatThreat({
      elapsedMs: this.elapsedMs,
      aliveCount: this.enemies.aliveCount,
      hasElite: this.enemies.eliteAlive,
      hasBoss: this.enemies.bossAlive,
    });

    this.hud.update(
      this.player.stats,
      this.elapsedMs,
      this.combat.kills,
      this.enemies.aliveCount,
      metaProg,
    );

    this.checkEndConditions();
  }

  private pulseMagnet(time: number): void {
    this.magnetUntil = Math.max(this.magnetUntil, time + PLAYER.killMagnetMs);
    this.xpPool.magnetizeAll();
  }

  private flushSkillHits(): void {
    const pending = this.weapons.pendingHits;
    while (pending.length > 0) {
      const hit = pending.pop()!;
      this.fx.damageNumber(hit.x, hit.y - 10, hit.amount, hit.crit, hit.style);
      if (hit.killed) this.fx.killBurst(hit.x, hit.y);
      else this.fx.hitBurst(hit.x, hit.y, hit.style === 'burn' ? 0xff8a5c : 0xffe66d);
    }
  }

  private flushSkillKills(
    pending: Array<{ x: number; y: number; xp: number; kind: EnemyKind }>,
  ): void {
    while (pending.length > 0) {
      const kill = pending.pop()!;
      this.combat.kills += 1;
      this.xpPool.spawn(kill.x, kill.y, kill.xp);
      this.pulseMagnet(this.time.now);
      audioDirector.playKill(kill.kind);
    }
  }

  private checkEndConditions(): void {
    if (this.player.stats.hp <= 0) {
      this.finish(false);
      return;
    }

    if (this.enemies.bossDefeated) {
      this.finish(true);
      return;
    }

    if (this.elapsedMs >= MATCH_DURATION_MS) {
      this.finish(true);
    }
  }

  private finish(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.levelUpUI.dismiss();
    this.hud.setVisible(false);
    this.joystick.setVisible(false);
    audioDirector.playMenu();

    const unlock = recordRun({
      characterId: this.player.character.id,
      won,
      kills: this.combat.kills,
      elapsedMs: this.elapsedMs,
      level: this.player.stats.level,
    });

    this.resultUI.show(
      won,
      this.combat.kills,
      this.player.stats.level,
      this.elapsedMs,
      this.player.character.name,
      unlock,
      won ? undefined : this.player.lastHurtCause,
    );
  }
}
