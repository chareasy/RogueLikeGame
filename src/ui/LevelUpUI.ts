import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import {
  pickUpgradeChoices,
  type UpgradeDef,
  type UpgradeId,
} from '../config/upgrades';

export class LevelUpUI {
  private readonly root: Phaser.GameObjects.Container;
  private readonly cards: Phaser.GameObjects.Container[] = [];
  private readonly hint: Phaser.GameObjects.Text;
  private pendingLevels = 0;
  private open = false;
  private onPick: ((id: UpgradeId) => void) | null = null;
  private stacks: Record<UpgradeId, number> | null = null;
  private currentChoices: UpgradeDef[] = [];
  private readonly keyHandler: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(200);
    this.root.setVisible(false);

    const dim = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x050814,
      0.72,
    );

    const title = scene.add
      .text(GAME_WIDTH / 2, 70, '升级！选择一项强化', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '26px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.hint = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 36, '按 1 / 2 / 3 选择，或点击卡片', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5);

    this.root.add([dim, title, this.hint]);

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

  queueLevels(
    levels: number,
    stacks: Record<UpgradeId, number>,
    onPick: (id: UpgradeId) => void,
  ): void {
    this.pendingLevels += levels;
    this.stacks = stacks;
    this.onPick = onPick;
    if (!this.open) this.showNext();
  }

  private showNext(): void {
    if (this.pendingLevels <= 0 || !this.stacks || !this.onPick) {
      this.close();
      return;
    }

    this.clearCards();
    this.open = true;
    this.root.setVisible(true);

    this.currentChoices = pickUpgradeChoices(this.stacks, 3);
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
    });
  }

  private createCard(
    upgrade: UpgradeDef,
    x: number,
    y: number,
    hotkey: number,
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y);
    const bg = this.scene.add
      .rectangle(0, 0, 240, 168, 0x1a2744, 0.95)
      .setStrokeStyle(2, 0x4fd1c5, 0.9)
      .setInteractive({ useHandCursor: true });

    const keyBadge = this.scene.add
      .text(-100, -66, String(hotkey), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#0b1020',
        backgroundColor: '#4fd1c5',
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0, 0);

    const title = this.scene.add
      .text(0, -40, upgrade.title, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#4fd1c5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const stack = this.stacks?.[upgrade.id] ?? 0;
    const desc = this.scene.add
      .text(0, 20, `${upgrade.description}\n当前层数 ${stack}/${upgrade.maxStacks}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#d7e2f7',
        align: 'center',
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x243556, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x1a2744, 0.95));
    bg.on('pointerdown', () => this.choose(upgrade.id));

    card.add([bg, keyBadge, title, desc]);
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
    this.clearCards();
    this.open = false;
    this.root.setVisible(false);
    this.pendingLevels = 0;
  }
}
