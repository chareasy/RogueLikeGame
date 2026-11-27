import Phaser from 'phaser';
import type { CharacterId } from '../config/characters';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import {
  isPreferredUpgrade,
  pickUpgradeChoices,
  type UpgradeDef,
  type UpgradeId,
} from '../config/upgrades';
import { pinToScreen } from './fixUi';
import { UiMotion } from './UiMotion';

export class LevelUpUI {
  private readonly root: Phaser.GameObjects.Container;
  private readonly cards: Phaser.GameObjects.Container[] = [];
  private readonly hint: Phaser.GameObjects.Text;
  private pendingLevels = 0;
  private open = false;
  private onPick: ((id: UpgradeId) => void) | null = null;
  private stacks: Record<UpgradeId, number> | null = null;
  private currentChoices: UpgradeDef[] = [];
  private characterId: CharacterId = 'knight';
  private readonly keyHandler: (event: KeyboardEvent) => void;
  onOpen: (() => void) | null = null;
  onClose: (() => void) | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(200);
    this.root.setVisible(false);

    const dim = scene.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x050814,
        0.72,
      )
      .setScrollFactor(0);

    const title = scene.add
      .text(GAME_WIDTH / 2, 70, '升级！选择一项强化', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '26px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.hint = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 36, '按 1 / 2 / 3 选择 · 金色角标=适合当前角色 · 前几次偏本职', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.root.add([dim, title, this.hint]);
    pinToScreen(this.root);

    this.keyHandler = (event: KeyboardEvent) => {
      if (!this.open) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < this.currentChoices.length) {
        const choice = this.currentChoices[index];
        if (choice) this.choose(choice.id);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.keyHandler);
    });
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Force-close if the run ends mid level-up. */
  dismiss(): void {
    this.close();
  }

  queueLevels(
    levels: number,
    stacks: Record<UpgradeId, number>,
    onPick: (id: UpgradeId) => void,
    characterId: CharacterId = 'knight',
  ): void {
    this.pendingLevels += levels;
    this.stacks = stacks;
    this.onPick = onPick;
    this.characterId = characterId;
    if (!this.open) this.showNext();
  }

  private showNext(): void {
    if (this.pendingLevels <= 0 || !this.stacks || !this.onPick) {
      this.close();
      return;
    }

    const wasOpen = this.open;
    this.clearCards();
    this.open = true;
    this.root.setVisible(true);
    if (!wasOpen) this.onOpen?.();

    this.currentChoices = pickUpgradeChoices(this.stacks, 3, this.characterId);
    const startX = GAME_WIDTH / 2 - (this.currentChoices.length - 1) * 140;
    this.currentChoices.forEach((upgrade, index) => {
      const card = this.createCard(
        upgrade,
        startX + index * 280,
        GAME_HEIGHT / 2 + 10,
        index + 1,
      );
      this.cards.push(card);
      this.root.add(card);
      card.setAlpha(0);
      card.y += 40;
      this.scene.tweens.add({
        targets: card,
        alpha: 1,
        y: GAME_HEIGHT / 2 + 10,
        delay: index * 80,
        duration: 320,
        ease: 'Back.easeOut',
      });
    });
    // Title sparkle burst.
    UiMotion.ensureAnims(this.scene);
    const spark = this.scene.add
      .sprite(GAME_WIDTH / 2, 70, 'ui_sparkle_sheet', 0)
      .setScrollFactor(0)
      .setDepth(210)
      .setScale(1.2)
      .play('ui_sparkle');
    this.root.add(spark);
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 1.8,
      duration: 700,
      onComplete: () => spark.destroy(),
    });
  }

  private createCard(
    upgrade: UpgradeDef,
    x: number,
    y: number,
    hotkey: number,
  ): Phaser.GameObjects.Container {
    const preferred = isPreferredUpgrade(this.characterId, upgrade.id);
    const card = this.scene.add.container(x, y).setScrollFactor(0);
    const bg = this.scene.add
      .rectangle(0, 0, 240, preferred ? 188 : 168, 0x1a2744, 0.95)
      .setStrokeStyle(2, preferred ? 0xffe66d : 0x4fd1c5, preferred ? 1 : 0.9)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const keyBadge = this.scene.add
      .text(-100, preferred ? -76 : -66, String(hotkey), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#0b1020',
        backgroundColor: preferred ? '#ffe66d' : '#4fd1c5',
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0, 0);

    const children: Phaser.GameObjects.GameObject[] = [bg, keyBadge];

    if (preferred) {
      const badge = this.scene.add
        .text(0, -72, '适合当前角色', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '12px',
          color: '#0b1020',
          backgroundColor: '#ffe66d',
          padding: { x: 8, y: 3 },
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      children.push(badge);
    }

    const title = this.scene.add
      .text(0, preferred ? -28 : -40, upgrade.title, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: preferred ? '#ffe66d' : '#4fd1c5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const stack = this.stacks?.[upgrade.id] ?? 0;
    const desc = this.scene.add
      .text(0, preferred ? 28 : 20, `${upgrade.description}\n当前层数 ${stack}/${upgrade.maxStacks}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#d7e2f7',
        align: 'center',
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x243556, 1);
      this.scene.tweens.add({
        targets: card,
        scale: 1.05,
        duration: 120,
        ease: 'Back.easeOut',
      });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a2744, 0.95);
      this.scene.tweens.add({ targets: card, scale: 1, duration: 120 });
    });
    bg.on('pointerdown', () => this.choose(upgrade.id));

    children.push(title, desc);
    card.add(children);
    pinToScreen(card);
    return card;
  }

  private choose(id: UpgradeId): void {
    if (!this.open) return;
    this.onPick?.(id);
    this.pendingLevels -= 1;
    if (this.pendingLevels > 0 && this.stacks) {
      this.showNext();
    } else {
      this.close();
    }
  }

  private clearCards(): void {
    for (const card of this.cards) card.destroy(true);
    this.cards.length = 0;
    this.currentChoices = [];
  }

  private close(): void {
    const wasOpen = this.open;
    this.clearCards();
    this.open = false;
    this.root.setVisible(false);
    this.pendingLevels = 0;
    if (wasOpen) this.onClose?.();
  }
}
