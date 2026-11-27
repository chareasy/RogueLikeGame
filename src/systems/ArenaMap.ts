import Phaser from 'phaser';
import { ARENA_HALF } from '../config/constants';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

export type Rock = { x: number; y: number; radius: number };
export type Pool = {
  x: number;
  y: number;
  radius: number;
  label: Phaser.GameObjects.Text;
};
export type SafeZone = {
  x: number;
  y: number;
  radius: number;
  activeUntil: number;
  nextAt: number;
  graphic: Phaser.GameObjects.Arc;
  icon: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
};

/**
 * Arena props: blocking rocks, poison pools, pulsing safe zones.
 * Visual language is intentionally distinct so players can read hazards at a glance.
 */
export class ArenaMap {
  readonly rocks: Rock[] = [];
  readonly poisons: Pool[] = [];
  readonly safes: SafeZone[] = [];
  private readonly poisonGfx: Phaser.GameObjects.Graphics;
  private poisonTickAcc = 0;
  private bubbleAcc = 0;
  private wasInSafe = false;
  private wasInPoison = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.poisonGfx = scene.add.graphics().setDepth(1);
    this.layout();
  }

  /** Irregular boulder silhouette — never reads as a joystick disc. */
  private drawBoulder(x: number, y: number, r: number): void {
    const g = this.scene.add.graphics().setDepth(2);
    const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
    const lobes = 5 + Math.floor(seed % 3);
    const pts: Array<{ ox: number; oy: number }> = [];
    for (let i = 0; i < lobes; i += 1) {
      const a = (i / lobes) * Math.PI * 2 + seed * 0.4;
      const jitter = 0.72 + ((seed * (i + 3)) % 1) * 0.38;
      pts.push({ ox: Math.cos(a) * r * jitter, oy: Math.sin(a) * r * jitter * 0.88 });
    }
    // Contact shadow under the mass.
    this.scene.add
      .ellipse(x + 6, y + r * 0.62, r * 1.85, r * 0.62, 0x000000, 0.38)
      .setDepth(1);

    g.fillStyle(0x3d4658, 1);
    g.lineStyle(3, 0x1a1f2e, 1);
    g.beginPath();
    g.moveTo(x + pts[0]!.ox, y + pts[0]!.oy);
    for (let i = 1; i < pts.length; i += 1) {
      g.lineTo(x + pts[i]!.ox, y + pts[i]!.oy);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Lighter top facet.
    g.fillStyle(0x6d7a90, 0.55);
    g.beginPath();
    g.moveTo(x - r * 0.35, y - r * 0.45);
    g.lineTo(x + r * 0.1, y - r * 0.55);
    g.lineTo(x + r * 0.05, y - r * 0.15);
    g.lineTo(x - r * 0.4, y - r * 0.1);
    g.closePath();
    g.fillPath();

    // Crack lines.
    g.lineStyle(2, 0x2a3140, 0.85);
    g.beginPath();
    g.moveTo(x - r * 0.15, y - r * 0.2);
    g.lineTo(x + r * 0.05, y + r * 0.15);
    g.lineTo(x + r * 0.28, y + r * 0.05);
    g.strokePath();
    g.beginPath();
    g.moveTo(x + r * 0.05, y + r * 0.15);
    g.lineTo(x - r * 0.2, y + r * 0.35);
    g.strokePath();

    // Moss speck.
    g.fillStyle(0x4a6b52, 0.55);
    g.fillCircle(x + r * 0.22, y + r * 0.18, r * 0.1);
    g.fillCircle(x - r * 0.3, y + r * 0.05, r * 0.07);
  }

  private layout(): void {
    const rockSpots: Array<[number, number, number]> = [
      [-420, -280, 48],
      [380, -320, 56],
      [-520, 360, 52],
      [460, 300, 60],
      [-180, 520, 44],
      [220, -560, 50],
      [0, 200, 40],
      [-700, -100, 54],
      [680, 80, 48],
      [-300, -650, 42],
    ];
    for (const [x, y, r] of rockSpots) {
      this.rocks.push({ x, y, radius: r });
      this.drawBoulder(x, y, r);
    }

    const poisonSpots: Array<[number, number, number]> = [
      [-250, 100, 70],
      [300, 180, 78],
      [-100, -400, 64],
      [550, -200, 72],
    ];
    for (const [x, y, r] of poisonSpots) {
      const label = this.scene.add
        .text(x, y, '☠ 毒', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '16px',
          color: '#d6ff9a',
          fontStyle: 'bold',
          stroke: '#1a3018',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(3)
        .setAlpha(0.35);
      this.poisons.push({ x, y, radius: r, label });
    }
    this.redrawPoisons(0, 0);

    // Safe zones are milestone-driven (no silent random pulse).
    const safeSpots: Array<[number, number, number]> = [
      [-600, 500, 90],
      [500, -480, 85],
      [50, 650, 80],
    ];
    for (const [x, y, r] of safeSpots) {
      const graphic = this.scene.add.circle(x, y, r, 0x3dd6c6, 0.16);
      graphic.setStrokeStyle(3, 0xb8fff4, 0.85);
      graphic.setDepth(1);
      graphic.setVisible(false);
      const icon = this.scene.add
        .text(x, y - 8, '🛡', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '22px',
        })
        .setOrigin(0.5)
        .setDepth(3)
        .setVisible(false);
      const label = this.scene.add
        .text(x, y + 16, '安全区', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '13px',
          color: '#b8fff4',
          fontStyle: 'bold',
          stroke: '#0b1020',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(3)
        .setVisible(false);
      this.safes.push({
        x,
        y,
        radius: r,
        activeUntil: 0,
        nextAt: Number.POSITIVE_INFINITY,
        graphic,
        icon,
        label,
      });
    }
  }

  /**
   * Activate the safest nearby zone (or closest) for a climax beat.
   * Returns the chosen zone center for banners.
   */
  activateSafeForEvent(
    time: number,
    nearX: number,
    nearY: number,
    durationMs = 14_000,
  ): { x: number; y: number } | null {
    if (this.safes.length === 0) return null;
    let best = this.safes[0]!;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const safe of this.safes) {
      // Prefer inactive zones near the player.
      const dist = Phaser.Math.Distance.Between(nearX, nearY, safe.x, safe.y);
      const busy = time < safe.activeUntil ? 400 : 0;
      if (dist + busy < bestDist) {
        bestDist = dist + busy;
        best = safe;
      }
    }
    best.activeUntil = time + durationMs;
    best.graphic.setVisible(true);
    best.icon.setVisible(true);
    best.label.setVisible(true);
    best.graphic.setAlpha(0.45);
    this.scene.tweens.add({
      targets: best.graphic,
      alpha: 0.16,
      duration: 700,
      yoyo: true,
      repeat: Math.max(1, Math.floor(durationMs / 1400)),
    });
    this.floatHint(best.x, best.y - best.radius, '安全区开启！', '#b8fff4');
    return { x: best.x, y: best.y };
  }

  /** Brief telegraph before a safe zone opens. */
  telegraphSafe(nearX: number, nearY: number, delayMs: number): void {
    if (this.safes.length === 0) return;
    let best = this.safes[0]!;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const safe of this.safes) {
      const dist = Phaser.Math.Distance.Between(nearX, nearY, safe.x, safe.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = safe;
      }
    }
    best.graphic.setVisible(true);
    best.graphic.setAlpha(0.08);
    best.label.setVisible(true);
    best.label.setText('安全区即将开启');
    best.label.setColor('#ffe66d');
    this.scene.time.delayedCall(delayMs, () => {
      if (best.label.active) {
        best.label.setText('安全区');
        best.label.setColor('#b8fff4');
      }
    });
  }

  private redrawPoisons(time: number, elapsedMs: number): void {
    this.poisonGfx.clear();
    // First ~75s: quieter rings so hazards don't own the opening shot.
    const early = elapsedMs < 75_000;
    const fillA = early ? 0.1 : 0.22;
    const innerA = early ? 0.14 : 0.3;
    const strokeA = early ? 0.35 : 0.7 + Math.sin(time / 200) * 0.15;
    for (const p of this.poisons) {
      this.poisonGfx.fillStyle(0x5a3d8b, fillA);
      this.poisonGfx.fillCircle(p.x, p.y, p.radius);
      this.poisonGfx.fillStyle(0x6fb84a, innerA);
      this.poisonGfx.fillCircle(p.x, p.y, p.radius * 0.72);
      this.poisonGfx.lineStyle(early ? 2 : 3, 0xc8ff6a, strokeA);
      this.poisonGfx.strokeCircle(p.x, p.y, p.radius);
      this.poisonGfx.lineStyle(2, 0x9b59b6, early ? 0.28 : 0.55);
      this.poisonGfx.strokeCircle(p.x, p.y, p.radius * 0.72);
      p.label.setAlpha(early ? 0.35 : 0.85);
    }
  }

  private spawnBubble(x: number, y: number, r: number): void {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() * r * 0.7;
    const bx = x + Math.cos(ang) * dist;
    const by = y + Math.sin(ang) * dist;
    const bubble = this.scene.add
      .circle(bx, by, 3 + Math.random() * 3, 0xb8ff6a, 0.7)
      .setDepth(3);
    this.scene.tweens.add({
      targets: bubble,
      y: by - 18 - Math.random() * 16,
      alpha: 0,
      scale: 0.3,
      duration: 500 + Math.random() * 300,
      onComplete: () => bubble.destroy(),
    });
  }

  private floatHint(x: number, y: number, text: string, color: string): void {
    const t = this.scene.add
      .text(x, y - 18, text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        color,
        fontStyle: 'bold',
        stroke: '#0b1020',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(45);
    this.scene.tweens.add({
      targets: t,
      y: y - 48,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  update(time: number, delta: number, player: Player, elapsedMs = 0): void {
    this.redrawPoisons(time, elapsedMs);

    this.bubbleAcc += delta;
    // Fewer bubbles early so the field stays readable.
    const bubbleEvery = elapsedMs < 75_000 ? 520 : 220;
    if (this.bubbleAcc >= bubbleEvery) {
      this.bubbleAcc = 0;
      for (const p of this.poisons) this.spawnBubble(p.x, p.y, p.radius);
    }

    // Safe zones only stay visible while an event keeps them active.
    for (const safe of this.safes) {
      const active = time < safe.activeUntil;
      if (!active && safe.graphic.visible && safe.label.text === '安全区') {
        safe.graphic.setVisible(false);
        safe.icon.setVisible(false);
        safe.label.setVisible(false);
      } else if (active) {
        safe.graphic.setVisible(true);
        safe.icon.setVisible(true);
        safe.label.setVisible(true);
      }
    }

    const inPoison =
      !this.isInSafe(player.x, player.y, time) &&
      this.poisons.some(
        (p) =>
          Phaser.Math.Distance.Between(player.x, player.y, p.x, p.y) <=
          p.radius + player.radius,
      );
    if (inPoison && !this.wasInPoison) {
      this.floatHint(player.x, player.y, '踩到毒池！', '#ff8aff');
    }
    this.wasInPoison = inPoison;

    // Poison DoT — soft for the opening minute, then full tick.
    this.poisonTickAcc += delta;
    const poisonInterval = elapsedMs < 60_000 ? 700 : 400;
    const poisonDmg = elapsedMs < 60_000 ? 2 : 4;
    if (this.poisonTickAcc >= poisonInterval) {
      this.poisonTickAcc = 0;
      if (inPoison) {
        player.tryHurt(poisonDmg, time, 'poison');
        this.floatHint(player.x, player.y - 6, '-毒', '#d6ff9a');
        const prevAlpha = player.sprite.alpha;
        player.sprite.setAlpha(0.55);
        this.scene.time.delayedCall(100, () => {
          if (player.sprite.active) player.sprite.setAlpha(prevAlpha);
        });
      }
    }

    const inSafe = this.isInSafe(player.x, player.y, time);
    if (inSafe && !this.wasInSafe) {
      this.floatHint(player.x, player.y, '进入安全区', '#7eeae0');
    }
    this.wasInSafe = inSafe;

    // Soft regen in safe zone.
    if (inSafe && player.stats.hp > 0) {
      player.stats.hp = Math.min(
        player.stats.maxHp,
        player.stats.hp + (3 * delta) / 1000,
      );
    }
  }

  isInSafe(x: number, y: number, time: number): boolean {
    for (const s of this.safes) {
      if (time < s.activeUntil && Phaser.Math.Distance.Between(x, y, s.x, s.y) <= s.radius) {
        return true;
      }
    }
    return false;
  }

  /** Push a point out of rocks; returns clamped position. */
  resolveRocks(x: number, y: number, radius: number): { x: number; y: number } {
    let px = x;
    let py = y;
    for (const rock of this.rocks) {
      const dx = px - rock.x;
      const dy = py - rock.y;
      let dist = Math.hypot(dx, dy);
      const min = rock.radius + radius;
      if (dist < min) {
        // Exact center → push in a stable random-ish direction.
        let nx = dx;
        let ny = dy;
        if (dist < 0.001) {
          const a = (rock.x * 12.9898 + rock.y * 78.233) % (Math.PI * 2);
          nx = Math.cos(a);
          ny = Math.sin(a);
          dist = 1;
        } else {
          nx /= dist;
          ny /= dist;
        }
        px = rock.x + nx * min;
        py = rock.y + ny * min;
      }
    }
    px = Phaser.Math.Clamp(px, -ARENA_HALF + radius, ARENA_HALF - radius);
    py = Phaser.Math.Clamp(py, -ARENA_HALF + radius, ARENA_HALF - radius);
    return { x: px, y: py };
  }

  resolveEnemy(enemy: Enemy): void {
    if (!enemy.active) return;
    const pos = this.resolveRocks(enemy.x, enemy.y, enemy.radius);
    enemy.x = pos.x;
    enemy.y = pos.y;
    enemy.body.setPosition(enemy.x, enemy.y);
  }
}
