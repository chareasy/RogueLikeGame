import Phaser from 'phaser';
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

    const characterId = (this.registry.get('selectedCharacter') as CharacterId) || 'knight';
    const character = getCharacter(characterId);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.drawArena();

    this.player = new Player(this, character);
    this.enemies = new EnemySystem(this);
    this.weapons = new WeaponSystem(this);
    this.xpPool = new XpPool(this);
    this.combat = new CombatSystem();
    this.hud = new Hud(this, character.name);
    this.levelUpUI = new LevelUpUI(this);
    this.resultUI = new ResultUI(this);

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setBounds(
      -ARENA_HALF - 40,
      -ARENA_HALF - 40,
      ARENA_SIZE + 80,
      ARENA_SIZE + 80,
    );

    for (let i = 0; i < 4; i += 1) {
      this.enemies.spawnKind('chaser', 0, 0, 320 + i * 40);
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
    if (this.ended) return;

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

    this.flushSkillKills(this.weapons.pendingOrbitKills);
    this.flushSkillKills(this.weapons.pendingAuraKills);

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

  private flushSkillKills(
    pending: Array<{ x: number; y: number; xp: number }>,
  ): void {
    while (pending.length > 0) {
      const kill = pending.pop()!;
      this.combat.kills += 1;
      this.xpPool.spawn(kill.x, kill.y, kill.xp);
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
    this.hud.setVisible(false);
    this.resultUI.show(
      won,
      this.combat.kills,
      this.player.stats.level,
      this.elapsedMs,
      this.player.character.name,
    );
  }
}
