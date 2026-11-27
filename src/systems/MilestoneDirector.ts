import Phaser from 'phaser';
import { BOSS_SPAWN_MS } from '../config/constants';
import type { EnemySystem } from './EnemySystem';
import type { Player } from '../entities/Player';
import type { XpPool } from './XpPool';
import { audioDirector } from '../audio/AudioDirector';

export interface MilestoneEvent {
  id: string;
  atMs: number;
  title: string;
  detail: string;
}

export const MILESTONES: MilestoneEvent[] = [
  {
    id: 'elite_surge',
    atMs: 2 * 60_000,
    title: '精英潮来袭！',
    detail: '高威胁单位集中出现',
  },
  {
    id: 'chest_wave',
    atMs: 4 * 60_000,
    title: '宝箱潮！',
    detail: '经验雨 + 磁场脉冲',
  },
  {
    id: 'boss_warning',
    atMs: BOSS_SPAWN_MS - 30_000,
    title: 'Boss 接近中…',
    detail: '30 秒后降临，准备走位',
  },
  {
    id: 'boss_arrive',
    atMs: BOSS_SPAWN_MS,
    title: 'Boss 降临！',
    detail: '集火核心，拉开距离',
  },
];

export class MilestoneDirector {
  private fired = new Set<string>();
  private banner?: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {}

  update(
    elapsedMs: number,
    enemies: EnemySystem,
    player: Player,
    xpPool: XpPool,
  ): void {
    for (const event of MILESTONES) {
      if (elapsedMs < event.atMs || this.fired.has(event.id)) continue;
      this.fired.add(event.id);
      this.trigger(event, enemies, player, xpPool);
    }
  }

  private trigger(
    event: MilestoneEvent,
    enemies: EnemySystem,
    player: Player,
    xpPool: XpPool,
  ): void {
    this.showBanner(event.title, event.detail);
    audioDirector.playMilestone(event.id);

    if (event.id === 'elite_surge') {
      for (let i = 0; i < 3; i += 1) {
        enemies.spawnKind('elite', player.x, player.y, 300 + i * 40);
      }
      for (let i = 0; i < 6; i += 1) {
        enemies.spawnKind('charger', player.x, player.y, 260 + i * 30);
      }
      this.scene.cameras.main.flash(180, 255, 120, 60);
    } else if (event.id === 'chest_wave') {
      for (let i = 0; i < 28; i += 1) {
        const a = (i / 28) * Math.PI * 2;
        const d = 40 + Math.random() * 160;
        xpPool.spawn(
          player.x + Math.cos(a) * d,
          player.y + Math.sin(a) * d,
          2 + Math.floor(Math.random() * 3),
        );
      }
      xpPool.magnetizeAll();
      for (let i = 0; i < 14; i += 1) {
        enemies.spawnKind('swarm', player.x, player.y, 220 + i * 18);
      }
      this.scene.cameras.main.flash(160, 120, 255, 160);
    } else if (event.id === 'boss_warning') {
      this.scene.cameras.main.shake(200, 0.003);
    } else if (event.id === 'boss_arrive') {
      this.scene.cameras.main.flash(320, 255, 40, 40);
      this.scene.cameras.main.shake(280, 0.006);
    }
  }

  private showBanner(title: string, detail: string): void {
    this.banner?.destroy(true);
    const { width } = this.scene.scale;
    const root = this.scene.add.container(width / 2, 90).setScrollFactor(0).setDepth(150);
    const bg = this.scene.add
      .rectangle(0, 0, 420, 64, 0x0b1020, 0.82)
      .setStrokeStyle(2, 0xffe66d, 0.9);
    const t = this.scene.add
      .text(0, -10, title, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#ffe66d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const d = this.scene.add
      .text(0, 16, detail, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#d7e2f7',
      })
      .setOrigin(0.5);
    root.add([bg, t, d]);
    root.setAlpha(0);
    this.scene.tweens.add({
      targets: root,
      alpha: 1,
      y: 110,
      duration: 280,
      ease: 'Cubic.easeOut',
      hold: 2200,
      yoyo: true,
      onComplete: () => root.destroy(true),
    });
    this.banner = root;
  }
}
