import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { ASSET_KEYS } from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { loadMeta } from '../config/meta';
import { UiMotion } from '../ui/UiMotion';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    audioDirector.attach(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(380, 11, 16, 32);

    const bg = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSET_KEYS.menuBg)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.78);
    UiMotion.kenBurns(this, bg);

    // Atmospheric banner strip behind title.
    const banner = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'ui_menu_banner')
      .setDisplaySize(GAME_WIDTH * 0.92, GAME_HEIGHT * 0.62)
      .setAlpha(0.42);
    this.tweens.add({
      targets: banner,
      alpha: { from: 0.28, to: 0.5 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.42)
      .setScrollFactor(0);

    UiMotion.addAmbientField(this, 12);

    const emblem = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, 'ui_energy_emblem')
      .setDisplaySize(78, 78)
      .setAlpha(0.9);
    this.tweens.add({
      targets: emblem,
      angle: 360,
      duration: 18000,
      repeat: -1,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: emblem,
      scale: emblem.scale * 1.08,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 78, '割草幸存者', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '52px',
        color: '#4fd1c5',
        fontStyle: 'bold',
        stroke: '#0b1020',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    UiMotion.breatheTitle(this, title);
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: GAME_HEIGHT / 2 - 90,
      duration: 520,
      ease: 'Back.easeOut',
    });

    // Orbiting slash FX near title.
    const slash = this.add
      .sprite(GAME_WIDTH / 2 + 150, GAME_HEIGHT / 2 - 100, 'ui_slash_sheet', 0)
      .setScale(1.4)
      .setAlpha(0.75)
      .play('ui_slash');
    this.tweens.add({
      targets: slash,
      x: GAME_WIDTH / 2 + 170,
      y: GAME_HEIGHT / 2 - 120,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, '多角色 · 多武器技能 · 更丰富怪潮', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#d7e2f7',
        stroke: '#0b1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    UiMotion.floatIn(this, subtitle, 18, 120);

    const meta = loadMeta();
    const metaText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 8,
        `局外进度  场次 ${meta.runs} · 胜场 ${meta.wins} · 最高击杀 ${meta.bestKills} · 强化 ${meta.starterBoosts.length}/4 · 皮肤 ${meta.tintSkins.length}/4`,
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '13px',
          color: '#ffe66d',
          stroke: '#0b1020',
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5);
    UiMotion.floatIn(this, metaText, 16, 200);

    // Floating XP orbs as brand motion.
    for (let i = 0; i < 3; i += 1) {
      const orb = this.add
        .sprite(GAME_WIDTH / 2 - 120 + i * 120, GAME_HEIGHT / 2 + 130, 'ui_xp_orb_sheet', 0)
        .setScale(0.9)
        .setAlpha(0.85)
        .play('ui_xp_orb');
      this.tweens.add({
        targets: orb,
        y: orb.y - 14,
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 62, 228, 54, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xb8fff4, 0.9);
    const btnText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 62, '选择角色', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    UiMotion.pulseButton(this, [btn, btnText]);
    UiMotion.floatIn(this, btn, 22, 280);
    UiMotion.floatIn(this, btnText, 22, 280);

    const unlockAndStart = () => {
      audioDirector.unlock();
      audioDirector.playUi();
      audioDirector.playMenu();
      this.cameras.main.fadeOut(220, 11, 16, 32);
      this.time.delayedCall(230, () => this.scene.start('CharacterSelectScene'));
    };

    this.input.once('pointerdown', () => {
      audioDirector.unlock();
      audioDirector.playMenu();
    });
    this.input.keyboard?.once('keydown', () => {
      audioDirector.unlock();
      audioDirector.playMenu();
    });

    btn.on('pointerover', () => {
      btn.setFillStyle(0x7eeae0, 1);
      UiMotion.popScale(this, btn);
      UiMotion.popScale(this, btnText);
    });
    btn.on('pointerout', () => btn.setFillStyle(0x4fd1c5, 1));
    btn.on('pointerdown', unlockAndStart);

    this.input.keyboard?.once('keydown-ENTER', unlockAndStart);
    this.input.keyboard?.once('keydown-SPACE', unlockAndStart);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '点击或按键开启音效 · Enter / 空格继续', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#c5d0e6',
        stroke: '#0b1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: hint,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  update(_time: number, delta: number): void {
    audioDirector.update(delta);
  }
}
