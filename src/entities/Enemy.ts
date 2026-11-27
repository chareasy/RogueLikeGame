import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import { ENEMY_DEFS, type EnemyKind } from '../config/enemies';

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

export class Enemy {
  active = false;
  kind: EnemyKind = 'chaser';
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

  readonly body: Phaser.GameObjects.Image;
  readonly hpBarBg: Phaser.GameObjects.Rectangle;
  readonly hpBarFg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
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
  }

  spawn(kind: EnemyKind, x: number, y: number): void {
    const def = ENEMY_DEFS[kind];
    this.active = true;
    this.kind = kind;
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
    this.nextTouchAt = 0;
    this.nextShotAt = 0;
    this.nextDashAt = 0;
    this.dashUntil = 0;
    this.flashUntil = 0;

    this.body.setTexture(ASSET_KEYS.enemies[kind]);
    const size = this.radius * 2.35;
    this.body.setDisplaySize(size, size);
    this.body.clearTint();
    this.body.setPosition(x, y);
    this.body.setVisible(true);
    this.body.setActive(true);
    this.body.setAlpha(1);

    const showBar = kind === 'elite' || kind === 'boss' || kind === 'tank';
    this.hpBarBg.setVisible(showBar);
    this.hpBarFg.setVisible(showBar);
    if (showBar) {
      const width = kind === 'boss' ? 80 : 36;
      this.hpBarBg.setSize(width, 5);
      this.hpBarFg.setSize(width, 5);
      this.syncHpBar();
    }
  }

  takeDamage(amount: number, time: number, knockbackX = 0, knockbackY = 0): boolean {
    this.hp -= amount;
    this.flashUntil = time + 80;
    this.body.setTintFill(0xffffff);
    if (knockbackX !== 0 || knockbackY !== 0) {
      this.x += knockbackX;
      this.y += knockbackY;
      this.body.setPosition(this.x, this.y);
    }
    if (this.kind === 'elite' || this.kind === 'boss' || this.kind === 'tank') {
      this.syncHpBar();
    }
    return this.hp <= 0;
  }

  private syncHpBar(): void {
    const width = this.kind === 'boss' ? 80 : 36;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.hpBarFg.width = width * ratio;
    this.hpBarBg.setPosition(this.x, this.y - this.radius - 12);
    this.hpBarFg.setPosition(this.x - width / 2, this.y - this.radius - 12);
  }

  update(
    time: number,
    delta: number,
    playerX: number,
    playerY: number,
    bullets: EnemyBullet[],
  ): void {
    if (!this.active) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (this.dashCooldownMs > 0 && time >= this.nextDashAt && dist < 360) {
      this.nextDashAt = time + this.dashCooldownMs;
      this.dashUntil = time + this.dashDurationMs;
      this.dashVx = nx * this.dashSpeed;
      this.dashVy = ny * this.dashSpeed;
    }

    let moveX = nx;
    let moveY = ny;
    let step = (this.speed * delta) / 1000;

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
      this.x += moveX * step;
      this.y += moveY * step;
      if (time >= this.flashUntil) this.body.clearTint();
    }

    this.body.setPosition(this.x, this.y);
    this.body.setFlipX(moveX < 0 || this.dashVx < 0);

    if (this.kind === 'elite' || this.kind === 'boss' || this.kind === 'tank') {
      this.syncHpBar();
    }

    if (this.shootCooldownMs > 0 && time >= this.nextShotAt && dist < 520) {
      this.nextShotAt = time + this.shootCooldownMs;
      this.fireBullet(nx, ny, bullets);
    }
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
    bullet.radius = this.kind === 'boss' ? 8 : 5;
    bullet.lifeMs = 2800;
    const size = bullet.radius * 2.4;
    bullet.graphic.setDisplaySize(size, size);
    bullet.graphic.setPosition(bullet.x, bullet.y);
    bullet.graphic.setRotation(Math.atan2(ny, nx));
    bullet.graphic.setVisible(true);
    bullet.graphic.setActive(true);
  }

  kill(): void {
    this.active = false;
    this.body.clearTint();
    this.body.setVisible(false);
    this.body.setActive(false);
    this.hpBarBg.setVisible(false);
    this.hpBarFg.setVisible(false);
  }
}
