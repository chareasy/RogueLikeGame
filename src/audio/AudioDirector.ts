import Phaser from 'phaser';
import { MATCH_DURATION_MS } from '../config/constants';
import type { EnemyKind } from '../config/enemies';

export type MusicMode = 'menu' | 'combat' | 'stopped';

const MENU_VOL = 0.42;
const COMBAT_MASTER = 0.38;
const FADE_MS = 1400;

/**
 * Crossfading music director:
 * - menu: heavy low drone
 * - combat: three intensity layers blended by threat
 */
export class AudioDirector {
  private scene: Phaser.Scene | null = null;
  private unlocked = false;
  private mode: MusicMode = 'stopped';
  private menu?: Phaser.Sound.BaseSound;
  private combat: Phaser.Sound.BaseSound[] = [];
  private targetCombatVols = [0, 0, 0];
  private currentCombatVols = [0, 0, 0];
  private menuVol = 0;
  private targetMenuVol = 0;
  private intensity = 0;
  private recentKills = 0;
  private killDecayAcc = 0;

  attach(scene: Phaser.Scene): void {
    this.scene = scene;
    if (!this.menu) {
      this.menu = scene.sound.add('bgm_menu', { loop: true, volume: 0 });
      this.combat = [
        scene.sound.add('bgm_combat_1', { loop: true, volume: 0 }),
        scene.sound.add('bgm_combat_2', { loop: true, volume: 0 }),
        scene.sound.add('bgm_combat_3', { loop: true, volume: 0 }),
      ];
    }
  }

  /** Must be called from a user gesture (click / key). */
  unlock(): void {
    if (!this.scene) return;
    if (!this.unlocked) {
      this.unlocked = true;
      // Resume audio context if suspended.
      const soundManager = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
      if (soundManager.context && soundManager.context.state === 'suspended') {
        void soundManager.context.resume();
      }
    }
    this.ensurePlaying();
  }

  playMenu(): void {
    this.mode = 'menu';
    this.targetMenuVol = MENU_VOL;
    this.targetCombatVols = [0, 0, 0];
    this.ensurePlaying();
  }

  playCombat(): void {
    this.mode = 'combat';
    this.targetMenuVol = 0;
    this.ensurePlaying();
  }

  stopAll(fadeMs = 800): void {
    this.mode = 'stopped';
    this.targetMenuVol = 0;
    this.targetCombatVols = [0, 0, 0];
    if (!this.scene) return;
    // volumes handled in update; optional hard stop later
    void fadeMs;
  }

  /**
   * Threat intensity 0..1 from match time, field density, elites/boss, recent kills.
   */
  setCombatThreat(input: {
    elapsedMs: number;
    aliveCount: number;
    hasElite: boolean;
    hasBoss: boolean;
  }): void {
    if (this.mode !== 'combat') return;
    const timeFactor = Phaser.Math.Clamp(input.elapsedMs / MATCH_DURATION_MS, 0, 1);
    const density = Phaser.Math.Clamp(input.aliveCount / 160, 0, 1);
    const killHeat = Phaser.Math.Clamp(this.recentKills / 18, 0, 1);
    let value =
      timeFactor * 0.4 + density * 0.25 + killHeat * 0.12;
    if (input.hasElite) value += 0.12;
    if (input.hasBoss) value += 0.28;
    this.intensity = Phaser.Math.Clamp(value, 0, 1);
    this.targetCombatVols = this.blendLayers(this.intensity);
  }

  private blendLayers(intensity: number): [number, number, number] {
    // Overlapping triangles so transitions stay smooth.
    const v1 = Phaser.Math.Clamp(1 - Math.abs(intensity - 0.2) / 0.35, 0, 1);
    const v2 = Phaser.Math.Clamp(1 - Math.abs(intensity - 0.55) / 0.35, 0, 1);
    const v3 = Phaser.Math.Clamp(1 - Math.abs(intensity - 0.9) / 0.4, 0, 1);
    const sum = v1 + v2 + v3 || 1;
    return [
      (v1 / sum) * COMBAT_MASTER,
      (v2 / sum) * COMBAT_MASTER,
      (v3 / sum) * COMBAT_MASTER,
    ];
  }

  playUi(): void {
    if (!this.unlocked || !this.scene) return;
    this.scene.sound.play('sfx_ui', { volume: 0.28, rate: 1 });
  }

  playKill(kind?: EnemyKind): void {
    if (!this.unlocked || !this.scene) return;
    this.recentKills = Math.min(30, this.recentKills + 1);
    let key = 'sfx_kill';
    let volume = 0.28;
    let rate = 0.92 + Math.random() * 0.25;
    if (kind === 'elite' || kind === 'tank') {
      key = 'sfx_kill_elite';
      volume = 0.36;
      rate = 0.9 + Math.random() * 0.15;
    } else if (kind === 'boss') {
      key = 'sfx_kill_boss';
      volume = 0.45;
      rate = 0.85 + Math.random() * 0.1;
    } else if (kind === 'swarm') {
      volume = 0.2;
      rate = 1.15 + Math.random() * 0.2;
    }
    this.scene.sound.play(key, { volume, rate });
  }

  /** Call every frame from an active scene. */
  update(delta: number): void {
    if (!this.unlocked) return;

    this.killDecayAcc += delta;
    if (this.killDecayAcc >= 400) {
      this.killDecayAcc = 0;
      this.recentKills = Math.max(0, this.recentKills - 1);
    }

    const step = Phaser.Math.Clamp(delta / FADE_MS, 0, 1);
    this.menuVol += (this.targetMenuVol - this.menuVol) * Math.max(step, 0.04);
    for (let i = 0; i < 3; i += 1) {
      this.currentCombatVols[i]! +=
        (this.targetCombatVols[i]! - this.currentCombatVols[i]!) *
        Math.max(step, 0.04);
    }

    if (this.menu && 'setVolume' in this.menu) {
      (this.menu as Phaser.Sound.WebAudioSound).setVolume(this.menuVol);
    }
    this.combat.forEach((s, i) => {
      if (s && 'setVolume' in s) {
        (s as Phaser.Sound.WebAudioSound).setVolume(this.currentCombatVols[i]!);
      }
    });
  }

  private ensurePlaying(): void {
    if (!this.unlocked || !this.scene) return;
    if (this.menu && !this.menu.isPlaying) this.menu.play();
    for (const track of this.combat) {
      if (track && !track.isPlaying) track.play();
    }
  }
}

export const audioDirector = new AudioDirector();
