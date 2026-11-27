import Phaser from 'phaser';
import type { CharacterDef } from '../config/characters';
import { ARENA_HALF, PLAYER } from '../config/constants';
import { hasTintSkin, loadMeta } from '../config/meta';
import type { ArenaMap } from '../systems/ArenaMap';
import { PlayerStats } from './PlayerStats';

export type DeathCause = 'contact' | 'bullet' | 'poison' | 'charge' | 'hazard' | 'unknown';

export const DEATH_CAUSE_LABEL: Record<DeathCause, string> = {
  contact: '被近战贴身击倒',
  bullet: '被敌方弹幕击倒',
  poison: '中毒耗尽生命',
  charge: '被冲锋撞倒',
  hazard: '踏入 Boss 禁区',
  unknown: '力竭倒下',
};

export class Player {
  readonly sprite: Phaser.GameObjects.Image;
  readonly radius = PLAYER.radius;
  readonly stats = new PlayerStats();
  readonly character: CharacterDef;
  invulnUntil = 0;
  /** Last damage source that hurt the player (for death attribution). */
  lastHurtCause: DeathCause = 'unknown';
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private stickX = 0;
  private stickY = 0;
  private arena: ArenaMap | null = null;

  constructor(private readonly scene: Phaser.Scene, character: CharacterDef) {
    this.character = character;
    this.stats.applyCharacter(character);
    const meta = loadMeta();
    if (meta.starterBoosts.includes(character.id)) {
      this.stats.applyStarterBoost(character);
    }

    this.sprite = scene.add.image(0, 0, character.assetKey);
    this.sprite.setDepth(10);
    this.sprite.setDisplaySize(PLAYER.radius * 2.4, PLAYER.radius * 2.4);
    if (hasTintSkin(meta, character.id)) {
      // Alt "skin": warm gold wash to show unlock.
      this.sprite.setTint(0xffe0a3);
    }

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  setArena(arena: ArenaMap): void {
    this.arena = arena;
  }

  /** Feed virtual joystick / external move vector (-1..1). */
  setStick(x: number, y: number): void {
    this.stickX = x;
    this.stickY = y;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  update(time: number, delta: number): void {
    this.stats.tickRegen(delta);

    let dx = this.stickX;
    let dy = this.stickY;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      const dist = (this.stats.speed * delta) / 1000;
      let nx = this.sprite.x + dx * dist;
      let ny = this.sprite.y + dy * dist;
      nx = Phaser.Math.Clamp(nx, -ARENA_HALF + this.radius, ARENA_HALF - this.radius);
      ny = Phaser.Math.Clamp(ny, -ARENA_HALF + this.radius, ARENA_HALF - this.radius);
      if (this.arena) {
        const resolved = this.arena.resolveRocks(nx, ny, this.radius);
        nx = resolved.x;
        ny = resolved.y;
      }
      this.sprite.x = nx;
      this.sprite.y = ny;
      this.sprite.setFlipX(dx < 0);
    }

    const flashing = time < this.invulnUntil;
    // Keep silhouette readable — never fade into a ghost ring.
    this.sprite.setAlpha(flashing ? 0.72 + 0.28 * Math.sin(time / 40) : 1);
  }

  grantInvuln(time: number, ms: number): void {
    this.invulnUntil = Math.max(this.invulnUntil, time + ms);
  }

  tryHurt(amount: number, time: number, cause: DeathCause = 'contact'): boolean {
    if (time < this.invulnUntil) return false;
    // Safe zone softens contact / poison hits.
    let dmg = amount;
    if (this.arena?.isInSafe(this.x, this.y, time)) {
      dmg = Math.max(1, Math.floor(amount * 0.35));
    }
    this.stats.hp = Math.max(0, this.stats.hp - dmg);
    this.lastHurtCause = cause;
    this.invulnUntil = time + PLAYER.invulnMs;
    this.scene.cameras.main.shake(140, 0.008);
    // Edge flash so hits are readable even in dense packs.
    this.scene.cameras.main.flash(110, 220, 40, 40);
    this.sprite.setTintFill(0xff6b6b);
    this.scene.time.delayedCall(90, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    return true;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
