import Phaser from 'phaser';
import {
  ARENA_HALF,
  ARENA_SIZE,
  COLORS,
  MATCH_DURATION_MS,
} from '../config/constants';
import { Player } from '../entities/Player';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpPool } from '../systems/XpPool';
import { Hud } from '../ui/Hud';
import { LevelUpUI } from '../ui/LevelUpUI';
import { ResultUI } from '../ui/ResultUI';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: EnemySystem;
  private weapons!: WeaponSystem;
  private xpPool!: XpPool;
  private combat!: CombatSystem;
  private hud!: Hud;
  private levelUpUI!: LevelUpUI;
  private resultUI!: ResultUI;

  private elapsedMs = 0;
  private ended = false;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.elapsedMs = 0;
    this.ended = false;

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.drawArena();

    this.player = new Player(this);
    this.enemies = new EnemySystem(this);
    this.weapons = new WeaponSystem(this);
    this.xpPool = new XpPool(this);
    this.combat = new CombatSystem();
    this.hud = new Hud(this);
    this.levelUpUI = new LevelUpUI(this);
    this.resultUI = new ResultUI(this);

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setBounds(
      -ARENA_HALF - 40,
      -ARENA_HALF - 40,
      ARENA_SIZE + 80,
      ARENA_SIZE + 80,
    );

    // Warm-up spawns so the arena isn't empty.
    for (let i = 0; i < 4; i += 1) {
      this.enemies.spawnKind('chaser', 0, 0, 320 + i * 40);
    }
  }

  private drawArena(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.arena, 1);
    g.fillRect(-ARENA_HALF, -ARENA_HALF, ARENA_SIZE, ARENA_SIZE);

    g.lineStyle(2, 0x2d4066, 1);
    g.strokeRect(-ARENA_HALF, -ARENA_HALF, ARENA_SIZE, ARENA_SIZE);

    g.lineStyle(1, COLORS.grid, 0.35);
    const step = 100;
    for (let x = -ARENA_HALF; x <= ARENA_HALF; x += step) {
      g.lineBetween(x, -ARENA_HALF, x, ARENA_HALF);
    }
    for (let y = -ARENA_HALF; y <= ARENA_HALF; y += step) {
      g.lineBetween(-ARENA_HALF, y, ARENA_HALF, y);
    }
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;

    // Use scene clock so time is stable.
    const time = this.time.now;

    if (this.levelUpUI.isOpen) {
      this.hud.update(
        this.player.stats,
        this.elapsedMs,
        this.combat.kills,
        this.enemies.aliveCount,
      );
      return;
    }

    this.elapsedMs += delta;
    this.player.update(time, delta);
    this.enemies.update(time, delta, this.elapsedMs, this.player);
    this.weapons.update(time, delta, this.player, this.enemies.enemies);

    this.combat.resolvePlayerProjectiles(
      time,
      this.weapons.projectiles,
      this.enemies.enemies,
      (x, y, value) => this.xpPool.spawn(x, y, value),
    );
    this.combat.resolveEnemyContact(time, this.player, this.enemies.enemies);
    this.combat.resolveEnemyBullets(time, this.player, this.enemies.bullets);

    const gained = this.combat.collectXp(delta, this.player, this.xpPool.orbs);
    if (gained > 0) {
      const levels = this.player.stats.addXp(gained);
      if (levels > 0) {
        this.levelUpUI.queueLevels(
          levels,
          this.player.stats.stacks,
          (id) => this.player.stats.applyUpgrade(id),
        );
      }
    }

    this.hud.update(
      this.player.stats,
      this.elapsedMs,
      this.combat.kills,
      this.enemies.aliveCount,
    );

    this.checkEndConditions();
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
    this.hud.setVisible(false);
    this.resultUI.show(
      won,
      this.combat.kills,
      this.player.stats.level,
      this.elapsedMs,
    );
  }
}
