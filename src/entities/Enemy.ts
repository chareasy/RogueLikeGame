import Phaser from 'phaser';
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
  graphic: Phaser.GameObjects.Arc;
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

  readonly body: Phaser.GameObjects.Arc;
  readonly hpBarBg: Phaser.GameObjects.Rectangle;
  readonly hpBarFg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.body = scene.add.circle(0, 0, 12, 0xff0000, 1);
    this.body.setVisible(false);
    this.body.setActive(false);
    this.body.setDepth(5);

    this.hpBarBg = scene.add.rectangle(0, 0, 28, 4, 0x000000, 0.55);
    this.hpBarFg = scene.add.rectangle(0, 0, 28, 4, 0x7CF29C, 1);
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
    this.nextTouchAt = 0;
    this.nextShotAt = 0;
    this.flashUntil = 0;

    this.body.setRadius(this.radius);
    this.body.setFillStyle(def.color, 1);
    this.body.setPosition(x, y);
    this.body.setVisible(true);
    this.body.setActive(true);
    this.body.setAlpha(1);

    const showBar = kind === 'elite' || kind === 'boss';
    this.hpBarBg.setVisible(showBar);
    this.hpBarFg.setVisible(showBar);
    if (showBar) {
      const width = kind === 'boss' ? 80 : 36;
      this.hpBarBg.setSize(width, 5);
      this.hpBarFg.setSize(width, 5);
      this.syncHpBar();
    }
  }

  takeDamage(amount: number, time: number): boolean {
    this.hp -= amount;
    this.flashUntil = time + 80;
    this.body.setFillStyle(0xffffff, 1);
    if (this.kind === 'elite' || this.kind === 'boss') this.syncHpBar();
    return this.hp <= 0;
  }

  private syncHpBar(): void {
    const width = this.kind === 'boss' ? 80 : 36;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.hpBarFg.width = width * ratio;
    this.hpBarBg.setPosition(this.x, this.y - this.radius - 10);
    this.hpBarFg.setPosition(this.x - width / 2, this.y - this.radius - 10);
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

    let moveX = nx;
    let moveY = ny;

    if (this.keepDistance > 0) {
      if (dist < this.keepDistance * 0.85) {
        moveX = -nx;
        moveY = -ny;
      } else if (dist > this.keepDistance * 1.15) {
        moveX = nx;
        moveY = ny;
      } else {
        // Strafe sideways when in band.
        moveX = -ny;
        moveY = nx;
      }
    }

    const step = (this.speed * delta) / 1000;
    this.x += moveX * step;
    this.y += moveY * step;
    this.body.setPosition(this.x, this.y);

    if (time < this.flashUntil) {
      // keep white flash
    } else {
      this.body.setFillStyle(ENEMY_DEFS[this.kind].color, 1);
    }

    if (this.kind === 'elite' || this.kind === 'boss') this.syncHpBar();

    if (
      this.shootCooldownMs > 0 &&
      time >= this.nextShotAt &&
      dist < 520
    ) {
      this.nextShotAt = time + this.shootCooldownMs;
      this.fireBullet(nx, ny, bullets);
    }
  }

  private fireBullet(
    nx: number,
    ny: number,
    bullets: EnemyBullet[],
  ): void {
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
    bullet.graphic.setRadius(bullet.radius);
    bullet.graphic.setFillStyle(0xff9aa2, 1);
    bullet.graphic.setPosition(bullet.x, bullet.y);
    bullet.graphic.setVisible(true);
    bullet.graphic.setActive(true);
  }

  kill(): void {
    this.active = false;
    this.body.setVisible(false);
    this.body.setActive(false);
    this.hpBarBg.setVisible(false);
    this.hpBarFg.setVisible(false);
  }
}
