import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { ASSET_KEYS } from '../config/assets';
import { CHARACTERS, type CharacterId } from '../config/characters';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export class CharacterSelectScene extends Phaser.Scene {
  private selected: CharacterId = 'knight';
  private cards: Phaser.GameObjects.Container[] = [];
  private detailText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelectScene');
  }

  create(): void {
    audioDirector.attach(this);
    audioDirector.unlock();
    audioDirector.playMenu();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSET_KEYS.menuBg)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.55);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.55);

    this.add
      .text(GAME_WIDTH / 2, 28, '选择角色', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#4fd1c5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH / 2, 62, '点击卡片选择 · Enter / 空格确认出发', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5, 0);

    const startX = 120;
    const gap = 180;
    CHARACTERS.forEach((hero, index) => {
      const card = this.createCard(hero.id, startX + index * gap, 210);
      this.cards.push(card);
    });

    this.detailText = this.add
      .text(GAME_WIDTH / 2, 360, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#e8eefc',
        align: 'center',
        wordWrap: { width: 720 },
      })
      .setOrigin(0.5, 0);

    const startBtn = this.add
      .rectangle(GAME_WIDTH / 2, 470, 220, 48, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, 470, '确认出发', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const start = () => {
      audioDirector.unlock();
      audioDirector.playUi();
      this.registry.set('selectedCharacter', this.selected);
      this.scene.start('GameScene');
    };
    startBtn.on('pointerover', () => startBtn.setFillStyle(0x7eeae0, 1));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x4fd1c5, 1));
    startBtn.on('pointerdown', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);

    this.select('knight');
  }

  update(_time: number, delta: number): void {
    audioDirector.update(delta);
  }

  private createCard(id: CharacterId, x: number, y: number): Phaser.GameObjects.Container {
    const hero = CHARACTERS.find((c) => c.id === id)!;
    const root = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, 160, 210, 0x1a2744, 0.95)
      .setStrokeStyle(2, 0x3a4f73, 1)
      .setInteractive({ useHandCursor: true });
    const portrait = this.add.image(0, -40, hero.assetKey).setDisplaySize(72, 72);
    const name = this.add
      .text(0, 30, hero.name, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        color: hero.accent,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const title = this.add
      .text(0, 54, hero.title, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5);

    bg.on('pointerdown', () => this.select(id));
    bg.on('pointerover', () => {
      if (this.selected !== id) bg.setFillStyle(0x243556, 1);
    });
    bg.on('pointerout', () => {
      if (this.selected !== id) bg.setFillStyle(0x1a2744, 0.95);
    });

    root.add([bg, portrait, name, title]);
    root.setData('id', id);
    root.setData('bg', bg);
    return root;
  }

  private select(id: CharacterId): void {
    if (this.selected !== id) audioDirector.playUi();
    this.selected = id;
    const hero = CHARACTERS.find((c) => c.id === id)!;
    for (const card of this.cards) {
      const cardId = card.getData('id') as CharacterId;
      const bg = card.getData('bg') as Phaser.GameObjects.Rectangle;
      if (cardId === id) {
        bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(hero.accent).color, 1);
        bg.setFillStyle(0x243556, 1);
      } else {
        bg.setStrokeStyle(2, 0x3a4f73, 1);
        bg.setFillStyle(0x1a2744, 0.95);
      }
    }
    this.detailText.setText(
      `${hero.description}\n生命 ${hero.maxHp} · 移速 ${hero.speed} · 伤害 ${hero.damage} · 主武器 ${weaponLabel(hero.primaryWeapon)}`,
    );
  }
}

function weaponLabel(kind: string): string {
  switch (kind) {
    case 'bolt':
      return '飞刃射击';
    case 'scatter':
      return '散射弹幕';
    case 'orbit':
      return '环绕星刃';
    case 'aura':
      return '焚场光环';
    default:
      return kind;
  }
}
