import Phaser from 'phaser';

/** Fix Phaser camera-scroll hitboxes for screen-space UI. */
export function pinToScreen(obj: Phaser.GameObjects.GameObject): void {
  const any = obj as Phaser.GameObjects.GameObject & {
    setScrollFactor?: (x: number, y?: number) => void;
    list?: Phaser.GameObjects.GameObject[];
  };
  any.setScrollFactor?.(0);
  if (Array.isArray(any.list)) {
    for (const child of any.list) pinToScreen(child);
  }
}

export function pinMany(...objs: Phaser.GameObjects.GameObject[]): void {
  for (const obj of objs) pinToScreen(obj);
}
