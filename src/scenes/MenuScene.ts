import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { ASSET_KEYS } from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { loadMeta } from '../config/meta';

const TITLE_FONT = '"ZCOOL XiaoWei", "Noto Serif SC", serif';
const UI_FONT = '"Noto Sans SC", "Segoe UI", sans-serif';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    document.body.classList.remove('in-combat');
    audioDirector.attach(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(320, 11, 16, 32);

    // Full-bleed hero plane — brand lives on the image, not in chrome.
    const heroBg = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSET_KEYS.menuBg)
      .setDisplaySize(GAME_WIDTH * 1.06, GAME_HEIGHT * 1.06)
      .setAlpha(0.92);

    // Soft bottom wash so CTA stays readable without boxing the brand.
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.72,
        GAME_WIDTH,
        GAME_HEIGHT * 0.56,
        0x050814,
        0.55,
      )
      .setOrigin(0.5, 0);

    const brand = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.34, '割草幸存者', {
        fontFamily: TITLE_FONT,
        fontSize: '64px',
        color: '#e8eefc',
        stroke: '#0b1020',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const tagline = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.34 + 58, '多角色清怪 · 技能成长 · 怪潮升级', {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#c5d0e6',
        stroke: '#0b1020',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const accent = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.34 + 86, 72, 3, 0x4fd1c5, 0.9)
      .setAlpha(0);

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, 240, 56, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xb8fff4, 0.9)
      .setAlpha(0);
    const btnText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, '选择角色', {
        fontFamily: UI_FONT,
        fontSize: '20px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const meta = loadMeta();
    const metaLine = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 48,
        `场次 ${meta.runs} · 胜场 ${meta.wins} · 最高击杀 ${meta.bestKills} · 强化 ${meta.starterBoosts.length}/4 · 皮肤 ${meta.tintSkins.length}/4`,
        {
          fontFamily: UI_FONT,
          fontSize: '12px',
          color: '#9fb0d0',
          stroke: '#0b1020',
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, '点击或按键开启音效 · Enter / 空格继续', {
        fontFamily: UI_FONT,
        fontSize: '11px',
        color: '#6f82a6',
        stroke: '#0b1020',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Intentional presence: slow hero drift + staggered reveal (no blocking loops).
    this.tweens.add({
      targets: heroBg,
      scaleX: heroBg.scaleX * 1.04,
      scaleY: heroBg.scaleY * 1.04,
      duration: 14000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: brand,
      alpha: 1,
      y: brand.y - 6,
      duration: 520,
      ease: 'Cubic.easeOut',
    });
    this.tweens.add({
      targets: [tagline, accent],
      alpha: 1,
      duration: 420,
      delay: 180,
      ease: 'Cubic.easeOut',
    });
    this.tweens.add({
      targets: [btn, btnText],
      alpha: 1,
      duration: 380,
      delay: 320,
      ease: 'Cubic.easeOut',
    });
    this.tweens.add({
      targets: [metaLine, hint],
      alpha: 1,
      duration: 360,
      delay: 480,
      ease: 'Cubic.easeOut',
    });

    const unlockAndStart = () => {
      audioDirector.unlock();
      audioDirector.playUi();
      audioDirector.playMenu();
      this.cameras.main.fadeOut(180, 11, 16, 32);
      this.time.delayedCall(190, () => this.scene.start('CharacterSelectScene'));
    };

    this.input.once('pointerdown', () => {
      audioDirector.unlock();
      audioDirector.playMenu();
    });
    this.input.keyboard?.once('keydown', () => {
      audioDirector.unlock();
      audioDirector.playMenu();
    });

    btn.on('pointerover', () => btn.setFillStyle(0x7eeae0, 1));
    btn.on('pointerout', () => btn.setFillStyle(0x4fd1c5, 1));
    btn.on('pointerdown', unlockAndStart);

    this.input.keyboard?.once('keydown-ENTER', unlockAndStart);
    this.input.keyboard?.once('keydown-SPACE', unlockAndStart);
  }

  update(_time: number, delta: number): void {
    audioDirector.update(delta);
  }
}
