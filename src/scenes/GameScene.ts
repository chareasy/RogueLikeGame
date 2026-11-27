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
  GAME_HEIGHT,
  GAME_WIDTH,
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
import { HealthPool } from '../systems/HealthPool';
import { MilestoneDirector } from '../systems/MilestoneDirector';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpPool } from '../systems/XpPool';
import { Hud } from '../ui/Hud';
import { LevelUpUI } from '../ui/LevelUpUI';
import { PauseUI } from '../ui/PauseUI';
import { ResultUI } from '../ui/ResultUI';
import { UiMotion } from '../ui/UiMotion';
import { VirtualJoystick } from '../ui/VirtualJoystick';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: EnemySystem;
  private weapons!: WeaponSystem;
  private xpPool!: XpPool;
  private healthPool!: HealthPool;
  private combat!: CombatSystem;
  private fx!: FeedbackFX;
  private arena!: ArenaMap;
  private milestones!: MilestoneDirector;
  private joystick!: VirtualJoystick;
  private hud!: Hud;
  private levelUpUI!: LevelUpUI;
  private resultUI!: ResultUI;
  private pauseUI!: PauseUI;

  private elapsedMs = 0;
  private ended = false;
  private magnetUntil = 0;
  private metaSnapshot = loadMeta();
  private keyHandlers: Array<() => void> = [];
  private lastHp = 0;
  private hurtFlash!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.elapsedMs = 0;
    this.ended = false;
    this.magnetUntil = 0;
    this.metaSnapshot = loadMeta();
    this.keyHandlers = [];
    document.body.classList.add('in-combat');

    audioDirector.attach(this);
    audioDirector.unlock();
    audioDirector.playCombat();

    const characterId = (this.registry.get('selectedCharacter') as CharacterId) || 'knight';
    const character = getCharacter(characterId);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(320, 11, 16, 32);
    this.drawArena();
    this.arena = new ArenaMap(this);
    UiMotion.ensureAnims(this);

    this.player = new Player(this, character);
    this.player.setArena(this.arena);
    this.lastHp = this.player.stats.hp;
    this.enemies = new EnemySystem(this);
    this.weapons = new WeaponSystem(this);
    this.xpPool = new XpPool(this);
    this.healthPool = new HealthPool(this);
    this.combat = new CombatSystem();
    this.fx = new FeedbackFX(this);
    this.milestones = new MilestoneDirector(this);
    this.milestones.setArena(this.arena);
    this.joystick = new VirtualJoystick(this);
    this.hud = new Hud(this, character.name, !this.joystick.touchMode);
    this.levelUpUI = new LevelUpUI(this);
    this.levelUpUI.onOpen = () => {
      const now = this.time.now;
      // Long cover while picking; shove packs so close doesn't resume on top of you.
      this.player.grantInvuln(now, 4200);
      this.shoveEnemiesFromPlayer(150);
      // Hide climax chrome so banners never cover upgrade cards.
      this.milestones.setUiMuted(true);
    };
    this.levelUpUI.onClose = () => {
      this.player.grantInvuln(this.time.now, 1400);
      this.shoveEnemiesFromPlayer(90);
      this.milestones.setUiMuted(false);
      // Sweep gems that stacked while the world was frozen.
      this.xpPool.magnetizeAll();
    };
    this.resultUI = new ResultUI(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.body.classList.remove('in-combat');
    });
    this.pauseUI = new PauseUI(this, this.joystick.touchMode);
    this.pauseUI.muted = audioDirector.isMuted;

    // Static vignette — no breathing pulse during combat.
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ui_combat_vignette')
      .setDisplaySize(GAME_WIDTH * 1.05, GAME_HEIGHT * 1.05)
      .setScrollFactor(0)
      .setDepth(90)
      .setAlpha(0.28);
    // Red edge overlay for hit feedback (normally invisible).
    this.hurtFlash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff2a2a, 0)
      .setScrollFactor(0)
      .setDepth(91)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setBounds(
      -ARENA_HALF - 40,
      -ARENA_HALF - 40,
      ARENA_SIZE + 80,
      ARENA_SIZE + 80,
    );

    // Melee kits open a bit lighter; still enough on-screen to feel like mowing.
    const openChasers = character.spawnPressure < 1 ? 5 : 7;
    const openSwarm = character.spawnPressure < 1 ? 2 : 3;
    for (let i = 0; i < openChasers; i += 1) {
      this.enemies.spawnKind('chaser', 0, 0, 300 + i * 40);
    }
    for (let i = 0; i < openSwarm; i += 1) {
      this.enemies.spawnKind('swarm', 0, 0, 360 + i * 32);
    }

    this.bindPauseKeys();
  }

  /** Push enemies outward so level-up / recovery doesn't resume inside a pile. */
  private shoveEnemiesFromPlayer(radius: number): void {
    const px = this.player.x;
    const py = this.player.y;
    for (const enemy of this.enemies.enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (dist >= radius || dist < 1) continue;
      const nx = (enemy.x - px) / dist;
      const ny = (enemy.y - py) / dist;
      const push = radius - dist + 24;
      enemy.x += nx * push;
      enemy.y += ny * push;
      enemy.body.setPosition(enemy.x, enemy.y);
    }
  }

  private pulseHurtFeedback(): void {
    audioDirector.playHurt();
    this.hud.pulseHurt();
    // Short red edge only — don't retint / re-pulse the whole vignette.
    this.tweens.killTweensOf(this.hurtFlash);
    this.hurtFlash.setAlpha(0.32);
    this.tweens.add({
      targets: this.hurtFlash,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
    });
  }

  private bindPauseKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    const bind = (key: string, fn: () => void) => {
      const handler = () => fn();
      kb.on(`keydown-${key}`, handler);
      this.keyHandlers.push(() => kb.off(`keydown-${key}`, handler));
    };
    const pauseHandlers = {
      onResume: () => this.milestones.setUiMuted(false),
      onStickChange: (forced: boolean) => this.joystick.setForceVisible(forced),
    };
    bind('ESC', () => {
      if (this.ended || this.levelUpUI.isOpen) return;
      this.pauseUI.toggle(pauseHandlers);
      this.milestones.setUiMuted(this.pauseUI.isOpen);
      audioDirector.playUi();
    });
    bind('M', () => {
      const muted = audioDirector.toggleMute();
      this.pauseUI.muted = muted;
      if (!muted) audioDirector.playUi();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.keyHandlers) off();
      this.keyHandlers = [];
    });
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

    if (this.pauseUI.isOpen) {
      return;
    }

    const time = this.time.now;
    const stickOn = this.joystick.touchMode || this.joystick.forceVisible;
    if (stickOn) {
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
    this.arena.update(time, delta, this.player, this.elapsedMs);
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
        this.maybeDropHeal(time);
      },
      this.fx,
    );

    this.flushSkillHits();
    this.flushSkillKills(this.weapons.pendingOrbitKills);
    this.flushSkillKills(this.weapons.pendingAuraKills);

    // Early contact soften + melee kit relief; fades in after opening minute.
    const charMul = this.player.character.contactTakenMul;
    let earlyMul = 1;
    if (this.elapsedMs < 45_000) earlyMul = 0.55;
    else if (this.elapsedMs < 90_000) earlyMul = 0.75;
    const contactScale = charMul * earlyMul;
    this.combat.resolveEnemyContact(
      time,
      this.player,
      this.enemies.enemies,
      contactScale,
    );
    this.combat.resolveEnemyBullets(time, this.player, this.enemies.bullets);

    // Soft pressure when strong clear leaves the field empty,
    // scaled by role spawnPressure (melee <1, mage/ranger >1).
    const alive = this.enemies.aliveCount;
    let bias = 1;
    if (alive < 10) bias = 1.45;
    else if (alive < 18) bias = 1.2;
    else if (alive > 60) bias = 0.85;
    // Opening window: mild ease for melee; clear kits refill faster.
    let openMul = 1;
    if (this.elapsedMs < 75_000) {
      openMul = this.player.character.spawnPressure < 1 ? 0.92 : 1.12;
    }
    this.enemies.setDensityBias(bias * this.player.character.spawnPressure * openMul);

    const magnetBoost = time < this.magnetUntil;
    const gained = this.combat.collectXp(
      delta,
      this.player,
      this.xpPool.orbs,
      magnetBoost,
    );
    this.healthPool.collect(this.player);
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

    if (this.player.stats.hp < this.lastHp) {
      this.pulseHurtFeedback();
    }
    this.lastHp = this.player.stats.hp;

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

  private maybeDropHeal(time: number): void {
    // Early sustain packs — melee kits get more; rarer after the opening minute.
    const melee = this.player.character.spawnPressure < 1;
    let chance = this.elapsedMs < 90_000 ? 0.12 : 0.035;
    if (melee && this.elapsedMs < 90_000) chance = 0.18;
    if (Math.random() > chance) return;
    const ang = Math.random() * Math.PI * 2;
    const d = 20 + Math.random() * 50;
    const amount =
      this.elapsedMs < 60_000 ? (melee ? 28 : 22) : melee ? 18 : 16;
    this.healthPool.spawn(
      this.player.x + Math.cos(ang) * d,
      this.player.y + Math.sin(ang) * d,
      amount,
    );
    void time;
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
      this.maybeDropHeal(this.time.now);
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
    document.body.classList.remove('in-combat');
    this.pauseUI.hide();
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
      this.player.character.id,
    );
  }
}
