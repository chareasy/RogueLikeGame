import Phaser from 'phaser';
import { BOSS_SPAWN_MS, GAME_WIDTH } from '../config/constants';
import type { Player } from '../entities/Player';
import type { XpPool } from './XpPool';
import { audioDirector } from '../audio/AudioDirector';
import type { ArenaMap } from './ArenaMap';
import type { EnemySystem } from './EnemySystem';

export interface MilestoneEvent {
  id: string;
  atMs: number;
  /** Seconds before the event to show a countdown telegraph. */
  warnMs?: number;
  title: string;
  detail: string;
  warnTitle?: string;
}

export const MILESTONES: MilestoneEvent[] = [
  {
    id: 'elite_surge',
    atMs: 2 * 60_000,
    warnMs: 7_000,
    title: '精英潮来袭！',
    detail: '高威胁单位集中出现',
    warnTitle: '精英潮将至',
  },
  {
    id: 'chest_wave',
    atMs: 4 * 60_000,
    warnMs: 7_000,
    title: '宝箱潮！',
    detail: '经验雨 + 磁场脉冲',
    warnTitle: '宝箱潮将至',
  },
  {
    id: 'boss_warning',
    atMs: BOSS_SPAWN_MS - 30_000,
    warnMs: 8_000,
    title: 'Boss 接近中…',
    detail: '30 秒后降临，准备走位',
    warnTitle: 'Boss 逼近',
  },
  {
    id: 'boss_arrive',
    atMs: BOSS_SPAWN_MS,
    warnMs: 6_000,
    title: 'Boss 降临！',
    detail: '集火核心，拉开距离',
    warnTitle: 'Boss 即将降临',
  },
];

export class MilestoneDirector {
  private fired = new Set<string>();
  private warnStarted = new Set<string>();
  private banner?: Phaser.GameObjects.Container;
  private countdownRoot?: Phaser.GameObjects.Container;
  private countdownText?: Phaser.GameObjects.Text;
  private countdownBar?: Phaser.GameObjects.Rectangle;
  private countdownBarBg?: Phaser.GameObjects.Rectangle;
  private countdownEvent: MilestoneEvent | null = null;
  /** When true, hide banners/countdowns so they never cover level-up / pause. */
  private uiMuted = false;

  private arena: ArenaMap | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  setArena(arena: ArenaMap): void {
    this.arena = arena;
  }

  /** Mute climax chrome while a blocking modal (level-up / pause) owns the screen. */
  setUiMuted(muted: boolean): void {
    this.uiMuted = muted;
    if (muted) {
      this.banner?.setVisible(false);
      this.countdownRoot?.setVisible(false);
    } else {
      this.banner?.setVisible(true);
      this.countdownRoot?.setVisible(true);
    }
  }

  update(
    elapsedMs: number,
    enemies: EnemySystem,
    player: Player,
    xpPool: XpPool,
  ): void {
    for (const event of MILESTONES) {
      const warnMs = event.warnMs ?? 0;
      if (
        warnMs > 0 &&
        !this.fired.has(event.id) &&
        !this.warnStarted.has(event.id) &&
        elapsedMs >= event.atMs - warnMs &&
        elapsedMs < event.atMs
      ) {
        this.warnStarted.add(event.id);
        this.beginCountdown(event);
        // No camera flash on warn — keeps combat readable.
        audioDirector.playUi();
        // Safe-zone telegraph tied to climax beats.
        if (
          event.id === 'elite_surge' ||
          event.id === 'chest_wave' ||
          event.id === 'boss_warning'
        ) {
          this.arena?.telegraphSafe(player.x, player.y, Math.min(warnMs, 5000));
        }
      }

      if (elapsedMs < event.atMs || this.fired.has(event.id)) continue;
      this.fired.add(event.id);
      this.clearCountdown();
      this.trigger(event, enemies, player, xpPool);
    }

    this.refreshCountdown(elapsedMs);
  }

  private beginCountdown(event: MilestoneEvent): void {
    this.clearCountdown();
    this.countdownEvent = event;
    const root = this.scene.add
      .container(GAME_WIDTH / 2, 52)
      .setScrollFactor(0)
      .setDepth(148);
    const bg = this.scene.add
      .rectangle(0, 0, 360, 44, 0x0b1020, 0.78)
      .setStrokeStyle(2, 0xffb347, 0.95);
    const title = this.scene.add
      .text(0, -8, event.warnTitle ?? event.title, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#ffb347',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const barBg = this.scene.add.rectangle(0, 12, 280, 8, 0x1a2744, 1).setOrigin(0.5);
    const bar = this.scene.add.rectangle(-140, 12, 280, 8, 0xffb347, 1).setOrigin(0, 0.5);
    const text = this.scene.add
      .text(0, 12, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    root.add([bg, title, barBg, bar, text]);
    root.setVisible(!this.uiMuted);
    this.countdownRoot = root;
    this.countdownText = text;
    this.countdownBar = bar;
    this.countdownBarBg = barBg;
  }

  private refreshCountdown(elapsedMs: number): void {
    if (!this.countdownEvent || !this.countdownRoot) return;
    const event = this.countdownEvent;
    const warnMs = event.warnMs ?? 1;
    const remain = Math.max(0, event.atMs - elapsedMs);
    if (remain <= 0) {
      this.clearCountdown();
      return;
    }
    const ratio = Phaser.Math.Clamp(remain / warnMs, 0, 1);
    const secs = (remain / 1000).toFixed(1);
    this.countdownText?.setText(`${secs}s`);
    this.countdownBar?.setScale(ratio, 1);
    // Steady alpha — no edge flicker under pressure.
    this.countdownRoot.setAlpha(this.uiMuted ? 0 : 1);
    void this.countdownBarBg;
  }

  private clearCountdown(): void {
    this.countdownRoot?.destroy(true);
    this.countdownRoot = undefined;
    this.countdownText = undefined;
    this.countdownBar = undefined;
    this.countdownBarBg = undefined;
    this.countdownEvent = null;
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
      this.arena?.activateSafeForEvent(this.scene.time.now, player.x, player.y, 18_000);
      for (let i = 0; i < 2; i += 1) {
        enemies.spawnKind('elite', player.x, player.y, 300 + i * 40);
      }
      enemies.spawnKind('shield_elite', player.x, player.y, 320);
      enemies.spawnRing('flanker', player.x, player.y, 6, 250);
      for (let i = 0; i < 4; i += 1) {
        enemies.spawnKind('charger', player.x, player.y, 280 + i * 30);
      }
    } else if (event.id === 'chest_wave') {
      this.arena?.activateSafeForEvent(this.scene.time.now, player.x, player.y, 16_000);
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
      enemies.spawnKind('summoner', player.x, player.y, 280);
      enemies.spawnKind('summoner', player.x, player.y, 340);
      enemies.spawnRing('swarm', player.x, player.y, 12, 230);
    } else if (event.id === 'boss_warning') {
      this.arena?.activateSafeForEvent(this.scene.time.now, player.x, player.y, 22_000);
    } else if (event.id === 'boss_arrive') {
      // Banner + extra safe refuge for the learnable phase loop.
      this.arena?.activateSafeForEvent(this.scene.time.now, player.x, player.y, 12_000);
    }
  }

  private showBanner(title: string, detail: string): void {
    this.banner?.destroy(true);
    // Don't spawn climax banners over blocking modals.
    if (this.uiMuted) return;
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
    root.setAlpha(1);
    // Short hold, no bounce — announce then clear.
    this.scene.time.delayedCall(1800, () => {
      if (this.banner === root) {
        root.destroy(true);
        this.banner = undefined;
      } else {
        root.destroy(true);
      }
    });
    this.banner = root;
  }
}
