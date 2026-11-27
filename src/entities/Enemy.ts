import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import {
  ENEMY_DEFS,
  type EnemyBehavior,
  type EnemyKind,
} from '../config/enemies';

export interface EnemyBullet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  lifeMs: number;
  graphic: Phaser.GameObjects.Image;
}

export interface EnemyHazard {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  until: number;
  damage: number;
  graphic: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

export class Enemy {
  active = false;
  kind: EnemyKind = 'chaser';
  behavior: EnemyBehavior = 'chase';
  x = 0;
  y = 0;
  hp = 0;
  maxHp = 0;
  radius = 12;
  speed = 60;
  damage = 8;
  xp = 2;
  touchCooldownMs = 500;
  nextTouchAt = 0;
  nextShotAt = 0;
  keepDistance = 0;
  shootCooldownMs = 0;
  projectileDamage = 0;
  projectileSpeed = 0;
  flashUntil = 0;

  dashCooldownMs = 0;
  dashSpeed = 0;
  dashDurationMs = 0;
  nextDashAt = 0;
  dashUntil = 0;
  dashVx = 0;
  dashVy = 0;
  /** Windup before dash completes. */
  telegraphUntil = 0;
  telegraphNx = 0;
  telegraphNy = 0;
  private readonly telegraphMs = 420;

  /** Flanker preferred angle around the player. */
  flankAngle = 0;
  /** Summoner. */
  summonCooldownMs = 0;
  nextSummonAt = 0;
  pendingSummons = 0;
  /** Shield elite frontal block. */
  shieldHalfAngle = 0;
  shieldFacing = 0;
  /** Boss phase 1–3. */
  bossPhase = 1;
  phaseAnnounce = false;
  pendingHazards = 0;

  readonly body: Phaser.GameObjects.Image;
  readonly hpBarBg: Phaser.GameObjects.Rectangle;
  readonly hpBarFg: Phaser.GameObjects.Rectangle;
  readonly warnGfx: Phaser.GameObjects.Graphics;
  readonly shieldGfx: Phaser.GameObjects.Graphics;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.body = scene.add.image(0, 0, ASSET_KEYS.enemies.chaser);
    this.body.setVisible(false);
    this.body.setActive(false);
    this.body.setDepth(5);

    this.hpBarBg = scene.add.rectangle(0, 0, 28, 4, 0x000000, 0.55);
    this.hpBarFg = scene.add.rectangle(0, 0, 28, 4, 0x7cf29c, 1);
    this.hpBarBg.setVisible(false);
    this.hpBarFg.setVisible(false);
    this.hpBarBg.setDepth(6);
    this.hpBarFg.setDepth(7);
    this.hpBarFg.setOrigin(0, 0.5);
    this.hpBarBg.setOrigin(0.5, 0.5);

    this.warnGfx = scene.add.graphics().setDepth(6);
    this.warnGfx.setVisible(false);
    this.shieldGfx = scene.add.graphics().setDepth(6);
    this.shieldGfx.setVisible(false);
  }

  spawn(kind: EnemyKind, x: number, y: number): void {
    const def = ENEMY_DEFS[kind];
    this.active = true;
    this.kind = kind;
    this.behavior = def.behavior ?? 'chase';
    this.x = x;
    this.y = y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.radius = def.radius;
    this.speed = def.speed;
    this.damage = def.damage;
    this.xp = def.xp;
    this.touchCooldownMs = def.touchCooldownMs;
    this.keepDistance = def.keepDistance ?? 0;
    this.shootCooldownMs = def.shootCooldownMs ?? 0;
    this.projectileDamage = def.projectileDamage ?? 0;
    this.projectileSpeed = def.projectileSpeed ?? 0;
    this.dashCooldownMs = def.dashCooldownMs ?? 0;
    this.dashSpeed = def.dashSpeed ?? 0;
    this.dashDurationMs = def.dashDurationMs ?? 0;
    this.summonCooldownMs = def.summonCooldownMs ?? 0;
    this.shieldHalfAngle = def.shieldHalfAngle ?? 0;
    this.nextTouchAt = 0;
    this.nextShotAt = 0;
    this.nextDashAt = 0;
    this.dashUntil = 0;
    this.telegraphUntil = 0;
    this.flashUntil = 0;
    this.flankAngle = Math.random() * Math.PI * 2;
    this.nextSummonAt = 0;
    this.pendingSummons = 0;
    this.pendingHazards = 0;
    this.bossPhase = 1;
    this.phaseAnnounce = false;
    this.shieldFacing = 0;

    const texKind = def.textureKey ?? kind;
    this.body.setTexture(ASSET_KEYS.enemies[texKind]);
    const size = this.radius * 2.35;
    this.body.setDisplaySize(size, size);
    this.body.clearTint();
    if (kind === 'flanker') this.body.setTint(0x7eeae0);
    if (kind === 'summoner') this.body.setTint(0xd4a5ff);
    if (kind === 'shield_elite') this.body.setTint(0x85c1e9);
    this.body.setPosition(x, y);
    this.body.setVisible(true);
    this.body.setActive(true);
    this.body.setAlpha(1);

    this.warnGfx.clear();
    this.warnGfx.setVisible(false);
    this.shieldGfx.clear();
    this.shieldGfx.setVisible(false);

    const showBar =
      kind === 'elite' ||
      kind === 'boss' ||
      kind === 'tank' ||
      kind === 'shield_elite' ||
      kind === 'summoner';
    this.hpBarBg.setVisible(showBar);
    this.hpBarFg.setVisible(showBar);
    if (showBar) {
      const width = kind === 'boss' ? 96 : kind === 'tank' || kind === 'shield_elite' ? 42 : 36;
      this.hpBarBg.setSize(width, kind === 'tank' || kind === 'shield_elite' ? 6 : 5);
      this.hpBarFg.setSize(width, kind === 'tank' || kind === 'shield_elite' ? 6 : 5);
      if (kind === 'tank') this.hpBarFg.setFillStyle(0xffb347, 1);
      else if (kind === 'shield_elite') this.hpBarFg.setFillStyle(0x5dade2, 1);
      else this.hpBarFg.setFillStyle(0x7cf29c, 1);
      this.syncHpBar();
    }
  }

  takeDamage(amount: number, time: number, knockbackX = 0, knockbackY = 0, fromX?: number, fromY?: number): boolean {
    let dmg = amount;
    if (this.behavior === 'shield' && fromX !== undefined && fromY !== undefined) {
      const ang = Math.atan2(fromY - this.y, fromX - this.x);
      let diff = Math.abs(Phaser.Math.Angle.Wrap(ang - this.shieldFacing));
      if (diff < this.shieldHalfAngle) {
        dmg = Math.max(1, Math.floor(amount * 0.18));
        this.flashShieldBlock();
      }
    }
    this.hp -= dmg;
    this.flashUntil = time + 80;
    this.body.setTintFill(0xffffff);
    if (knockbackX !== 0 || knockbackY !== 0) {
      this.x += knockbackX;
      this.y += knockbackY;
      this.body.setPosition(this.x, this.y);
    }
    if (this.showsHpBar()) this.syncHpBar();
    return this.hp <= 0;
  }

  private flashShieldBlock(): void {
    this.shieldGfx.setAlpha(1);
    this.scene.tweens.add({
      targets: this.shieldGfx,
      alpha: 0.55,
      duration: 120,
    });
  }

  private showsHpBar(): boolean {
    return (
      this.kind === 'elite' ||
      this.kind === 'boss' ||
      this.kind === 'tank' ||
      this.kind === 'shield_elite' ||
      this.kind === 'summoner'
    );
  }

  private syncHpBar(): void {
    const width =
      this.kind === 'boss' ? 96 : this.kind === 'tank' || this.kind === 'shield_elite' ? 42 : 36;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.hpBarFg.width = width * ratio;
    this.hpBarBg.setPosition(this.x, this.y - this.radius - 12);
    this.hpBarFg.setPosition(this.x - width / 2, this.y - this.radius - 12);
    if (this.kind === 'boss') {
      if (ratio > 0.66) this.hpBarFg.setFillStyle(0x7cf29c, 1);
      else if (ratio > 0.33) this.hpBarFg.setFillStyle(0xffe66d, 1);
      else this.hpBarFg.setFillStyle(0xff6b6b, 1);
    }
  }

  update(
    time: number,
    delta: number,
    playerX: number,
    playerY: number,
    bullets: EnemyBullet[],
  ): void {
    if (!this.active) return;

    if (this.behavior === 'boss') {
      this.updateBoss(time, delta, playerX, playerY, bullets);
      return;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (this.behavior === 'shield') {
      this.shieldFacing = Math.atan2(ny, nx);
      this.drawShield();
    }

    // Charger windup telegraph before dash.
    if (this.dashCooldownMs > 0 && this.telegraphUntil === 0 && time >= this.nextDashAt && dist < 360) {
      this.telegraphUntil = time + this.telegraphMs;
      this.telegraphNx = nx;
      this.telegraphNy = ny;
      this.nextDashAt = time + this.dashCooldownMs;
    }

    if (this.telegraphUntil > 0 && time < this.telegraphUntil) {
      this.drawTelegraph(time);
      this.body.setTint(0xff5555);
      this.x += (nx * this.speed * 0.25 * delta) / 1000;
      this.y += (ny * this.speed * 0.25 * delta) / 1000;
      this.body.setPosition(this.x, this.y);
      if (this.showsHpBar()) this.syncHpBar();
      return;
    }

    if (this.telegraphUntil > 0 && time >= this.telegraphUntil) {
      this.telegraphUntil = 0;
      this.warnGfx.clear();
      this.warnGfx.setVisible(false);
      this.dashUntil = time + this.dashDurationMs;
      this.dashVx = this.telegraphNx * this.dashSpeed;
      this.dashVy = this.telegraphNy * this.dashSpeed;
    }

    let moveX = nx;
    let moveY = ny;

    if (time < this.dashUntil) {
      this.x += (this.dashVx * delta) / 1000;
      this.y += (this.dashVy * delta) / 1000;
      this.body.setTint(0xfff59d);
    } else {
      if (this.behavior === 'flank') {
        this.flankAngle += (delta / 1000) * 0.9;
        const orbitR = 150;
        const tx = playerX + Math.cos(this.flankAngle) * orbitR;
        const ty = playerY + Math.sin(this.flankAngle) * orbitR;
        const fdx = tx - this.x;
        const fdy = ty - this.y;
        const fd = Math.hypot(fdx, fdy) || 1;
        moveX = fdx / fd;
        moveY = fdy / fd;
        // Close in slowly while circling.
        if (dist > 120) {
          moveX = moveX * 0.65 + nx * 0.35;
          moveY = moveY * 0.65 + ny * 0.35;
        }
      } else if (this.keepDistance > 0) {
        if (dist < this.keepDistance * 0.85) {
          moveX = -nx;
          moveY = -ny;
        } else if (dist > this.keepDistance * 1.15) {
          moveX = nx;
          moveY = ny;
        } else {
          moveX = -ny;
          moveY = nx;
        }
      }
      const step = (this.speed * delta) / 1000;
      this.x += moveX * step;
      this.y += moveY * step;
      if (time >= this.flashUntil) {
        if (this.kind === 'flanker') this.body.setTint(0x7eeae0);
        else if (this.kind === 'summoner') this.body.setTint(0xd4a5ff);
        else if (this.kind === 'shield_elite') this.body.setTint(0x85c1e9);
        else this.body.clearTint();
      }
    }

    this.body.setPosition(this.x, this.y);
    this.body.setFlipX(moveX < 0 || this.dashVx < 0);

    if (this.showsHpBar()) this.syncHpBar();

    if (this.shootCooldownMs > 0 && time >= this.nextShotAt && dist < 520) {
      this.nextShotAt = time + this.shootCooldownMs;
      this.fireBullet(nx, ny, bullets);
    }

    if (this.behavior === 'summon' && this.summonCooldownMs > 0 && time >= this.nextSummonAt) {
      this.nextSummonAt = time + this.summonCooldownMs;
      this.pendingSummons += 3;
      this.body.setTintFill(0xe0b0ff);
    }
  }

  private updateBoss(
    time: number,
    delta: number,
    playerX: number,
    playerY: number,
    bullets: EnemyBullet[],
  ): void {
    const ratio = this.hp / this.maxHp;
    const nextPhase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (nextPhase !== this.bossPhase) {
      this.bossPhase = nextPhase;
      this.phaseAnnounce = true;
      // Phase punch: brief invuln flash + faster cadence.
      this.flashUntil = time + 400;
      this.body.setTintFill(0xffffff);
      if (nextPhase === 2) {
        this.shootCooldownMs = 900;
        this.speed = 62;
        this.pendingSummons += 4;
      } else if (nextPhase === 3) {
        this.shootCooldownMs = 700;
        this.speed = 70;
        this.dashCooldownMs = 2600;
        this.pendingHazards += 3;
      }
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    // Phase 3: charger-like telegraphed dashes.
    if (
      this.bossPhase >= 3 &&
      this.dashCooldownMs > 0 &&
      this.telegraphUntil === 0 &&
      time >= this.nextDashAt &&
      dist < 420
    ) {
      this.telegraphUntil = time + 560;
      this.telegraphNx = nx;
      this.telegraphNy = ny;
      this.nextDashAt = time + this.dashCooldownMs;
    }

    if (this.telegraphUntil > 0 && time < this.telegraphUntil) {
      this.drawTelegraph(time, 220);
      this.body.setTint(0xff5555);
      this.x += (nx * this.speed * 0.15 * delta) / 1000;
      this.y += (ny * this.speed * 0.15 * delta) / 1000;
      this.body.setPosition(this.x, this.y);
      this.syncHpBar();
      return;
    }

    if (this.telegraphUntil > 0 && time >= this.telegraphUntil) {
      this.telegraphUntil = 0;
      this.warnGfx.clear();
      this.warnGfx.setVisible(false);
      this.dashUntil = time + this.dashDurationMs;
      this.dashVx = this.telegraphNx * this.dashSpeed;
      this.dashVy = this.telegraphNy * this.dashSpeed;
    }

    let moveX = nx;
    let moveY = ny;
    if (time < this.dashUntil) {
      this.x += (this.dashVx * delta) / 1000;
      this.y += (this.dashVy * delta) / 1000;
      this.body.setTint(0xfff59d);
    } else {
      if (this.keepDistance > 0) {
        if (dist < this.keepDistance * 0.85) {
          moveX = -nx;
          moveY = -ny;
        } else if (dist > this.keepDistance * 1.15) {
          moveX = nx;
          moveY = ny;
        } else {
          moveX = -ny;
          moveY = nx;
        }
      }
      const step = (this.speed * delta) / 1000;
      this.x += moveX * step;
      this.y += moveY * step;
      if (time >= this.flashUntil) this.body.clearTint();
    }

    this.body.setPosition(this.x, this.y);
    this.body.setFlipX(moveX < 0 || this.dashVx < 0);
    this.syncHpBar();

    if (this.shootCooldownMs > 0 && time >= this.nextShotAt && dist < 560) {
      this.nextShotAt = time + this.shootCooldownMs;
      if (this.bossPhase === 1) {
        this.fireBullet(nx, ny, bullets);
      } else if (this.bossPhase === 2) {
        // Learnable ring + aimed shot.
        this.fireRing(bullets, 8, 0.85);
        this.fireBullet(nx, ny, bullets);
      } else {
        // Phase 3: fan spray toward player.
        this.fireFan(nx, ny, bullets, 5, 0.55);
        if (Math.random() < 0.35) this.pendingHazards += 1;
      }
    }
  }

  private drawShield(): void {
    this.shieldGfx.setVisible(true);
    this.shieldGfx.clear();
    const start = this.shieldFacing - this.shieldHalfAngle;
    const end = this.shieldFacing + this.shieldHalfAngle;
    this.shieldGfx.lineStyle(4, 0x5dade2, 0.85);
    this.shieldGfx.beginPath();
    this.shieldGfx.arc(this.x, this.y, this.radius + 10, start, end, false);
    this.shieldGfx.strokePath();
    this.shieldGfx.fillStyle(0x5dade2, 0.12);
    this.shieldGfx.slice(this.x, this.y, this.radius + 10, start, end, false);
    this.shieldGfx.fillPath();
  }

  private drawTelegraph(time: number, reach = 160): void {
    const pulse = 0.45 + Math.sin(time / 50) * 0.25;
    this.warnGfx.setVisible(true);
    this.warnGfx.clear();
    this.warnGfx.lineStyle(3, 0xff4444, pulse);
    this.warnGfx.beginPath();
    this.warnGfx.moveTo(this.x, this.y);
    this.warnGfx.lineTo(
      this.x + this.telegraphNx * reach,
      this.y + this.telegraphNy * reach,
    );
    this.warnGfx.strokePath();
    this.warnGfx.fillStyle(0xff2222, pulse * 0.35);
    this.warnGfx.fillCircle(this.x, this.y, this.radius + 6);
  }

  private fireBullet(nx: number, ny: number, bullets: EnemyBullet[]): void {
    const bullet = bullets.find((b) => !b.active);
    if (!bullet) return;
    bullet.active = true;
    bullet.x = this.x;
    bullet.y = this.y;
    bullet.vx = nx * this.projectileSpeed;
    bullet.vy = ny * this.projectileSpeed;
    bullet.damage = this.projectileDamage;
    bullet.radius = this.kind === 'boss' ? 11 : 8;
    bullet.lifeMs = 2800;
    const size = bullet.radius * 2.6;
    bullet.graphic.setDisplaySize(size, size);
    bullet.graphic.setTint(this.kind === 'boss' ? 0xff6b6b : 0xff8a5c);
    bullet.graphic.setPosition(bullet.x, bullet.y);
    bullet.graphic.setRotation(Math.atan2(ny, nx));
    bullet.graphic.setVisible(true);
    bullet.graphic.setActive(true);
  }

  private fireRing(bullets: EnemyBullet[], count: number, speedMul: number): void {
    const speed = this.projectileSpeed * speedMul;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const bullet = bullets.find((b) => !b.active);
      if (!bullet) break;
      bullet.active = true;
      bullet.x = this.x;
      bullet.y = this.y;
      bullet.vx = Math.cos(a) * speed;
      bullet.vy = Math.sin(a) * speed;
      bullet.damage = this.projectileDamage;
      bullet.radius = 9;
      bullet.lifeMs = 2600;
      bullet.graphic.setDisplaySize(24, 24);
      bullet.graphic.setTint(0xffe66d);
      bullet.graphic.setPosition(bullet.x, bullet.y);
      bullet.graphic.setRotation(a);
      bullet.graphic.setVisible(true);
      bullet.graphic.setActive(true);
    }
  }

  private fireFan(
    nx: number,
    ny: number,
    bullets: EnemyBullet[],
    count: number,
    spread: number,
  ): void {
    const base = Math.atan2(ny, nx);
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1);
      const ang = base - spread / 2 + spread * t;
      this.fireBullet(Math.cos(ang), Math.sin(ang), bullets);
    }
  }

  kill(): void {
    this.active = false;
    this.telegraphUntil = 0;
    this.pendingSummons = 0;
    this.pendingHazards = 0;
    this.warnGfx.clear();
    this.warnGfx.setVisible(false);
    this.shieldGfx.clear();
    this.shieldGfx.setVisible(false);
    this.body.clearTint();
    this.body.setVisible(false);
    this.body.setActive(false);
    this.hpBarBg.setVisible(false);
    this.hpBarFg.setVisible(false);
  }
}
