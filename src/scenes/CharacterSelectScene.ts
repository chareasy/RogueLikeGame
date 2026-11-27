import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { ASSET_KEYS } from '../config/assets';
import { CHARACTERS, type CharacterId } from '../config/characters';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export class CharacterSelectScene extends Phaser.Scene {
  private selected: CharacterId = 'knight';
  private cards: Phaser.GameObjects.Container[] = [];
  private detailText!: Phaser.GameObjects.Text;
  private keyHandlers: Array<() => void> = [];

  constructor() {
    super('CharacterSelectScene');
  }

  create(): void {
    this.cards = [];
    this.keyHandlers = [];

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
      .text(GAME_WIDTH / 2, 22, '选择角色', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#4fd1c5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH / 2, 56, '点击卡片 / 按 1–4 选择 · Enter / 空格确认出发', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5, 0);

    const cardW = 200;
    const gap = 16;
    const totalW = CHARACTERS.length * cardW + (CHARACTERS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    CHARACTERS.forEach((hero, index) => {
      const card = this.createCard(hero.id, startX + index * (cardW + gap), 230, cardW, index + 1);
      this.cards.push(card);
    });

    this.detailText = this.add
      .text(GAME_WIDTH / 2, 380, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#e8eefc',
        align: 'center',
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5, 0);

    const startBtn = this.add
      .rectangle(GAME_WIDTH / 2, 490, 240, 52, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, 490, '确认出发', {
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

    const kb = this.input.keyboard;
    if (kb) {
      const bind = (key: string, fn: () => void) => {
        const handler = () => fn();
        kb.on(`keydown-${key}`, handler);
        this.keyHandlers.push(() => kb.off(`keydown-${key}`, handler));
      };
      bind('ENTER', start);
      bind('SPACE', start);
      // Phaser key names are ONE/TWO/... not "1"/"2".
      const digitKeys = ['ONE', 'TWO', 'THREE', 'FOUR'] as const;
      CHARACTERS.forEach((hero, index) => {
        const key = digitKeys[index];
        if (key) bind(key, () => this.select(hero.id));
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.keyHandlers) off();
      this.keyHandlers = [];
    });

    this.select('knight');
  }

  update(_time: number, delta: number): void {
    audioDirector.update(delta);
  }

  private createCard(
    id: CharacterId,
    x: number,
    y: number,
    width: number,
    hotkey: number,
  ): Phaser.GameObjects.Container {
    const hero = CHARACTERS.find((c) => c.id === id)!;
    const height = 250;
    const root = this.add.container(x, y);

    // Large hit area covering the whole card.
    const hit = this.add
      .rectangle(0, 0, width, height, 0x1a2744, 0.95)
      .setStrokeStyle(2, 0x3a4f73, 1)
      .setInteractive({ useHandCursor: true });

    const keyBadge = this.add
      .text(-width / 2 + 14, -height / 2 + 10, String(hotkey), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#7eeae0',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    const portrait = this.add.image(0, -48, hero.assetKey).setDisplaySize(88, 88);
    const name = this.add
      .text(0, 28, hero.name, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
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
    const tip = this.add
      .text(0, 88, `按 ${hotkey} 选择`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#6f82a6',
      })
      .setOrigin(0.5);

    hit.on('pointerdown', () => this.select(id));
    hit.on('pointerover', () => {
      if (this.selected !== id) hit.setFillStyle(0x243556, 1);
    });
    hit.on('pointerout', () => {
      if (this.selected !== id) hit.setFillStyle(0x1a2744, 0.95);
    });

    root.add([hit, keyBadge, portrait, name, title, tip]);
    root.setData('id', id);
    root.setData('bg', hit);
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
