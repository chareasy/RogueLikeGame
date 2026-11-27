import { PLAYER, WEAPON } from '../config/constants';
import type { UpgradeId } from '../config/upgrades';

export class PlayerStats {
  level = 1;
  xp = 0;
  xpToNext = PLAYER.xpToLevelBase;
  hp = PLAYER.maxHp;
  maxHp = PLAYER.maxHp;
  speed = PLAYER.speed;
  pickupRadius = PLAYER.pickupRadius;

  damage = WEAPON.damage;
  cooldownMs = WEAPON.cooldownMs;
  projectileCount = WEAPON.count;
  pierce = WEAPON.pierce;
  projectileRadius = WEAPON.projectileRadius;
  projectileSpeed = WEAPON.projectileSpeed;

  stacks: Record<UpgradeId, number> = {
    damage: 0,
    count: 0,
    firerate: 0,
    pierce: 0,
    movespeed: 0,
    maxhp: 0,
    magnet: 0,
    area: 0,
  };

  applyUpgrade(id: UpgradeId): void {
    this.stacks[id] += 1;
    switch (id) {
      case 'damage':
        this.damage *= 1.25;
        break;
      case 'count':
        this.projectileCount += 1;
        break;
      case 'firerate':
        this.cooldownMs *= 0.88;
        break;
      case 'pierce':
        this.pierce += 1;
        break;
      case 'movespeed':
        this.speed *= 1.1;
        break;
      case 'maxhp': {
        const prev = this.maxHp;
        this.maxHp += 20;
        this.hp += this.maxHp - prev;
        break;
      }
      case 'magnet':
        this.pickupRadius *= 1.4;
        break;
      case 'area':
        this.projectileRadius *= 1.2;
        break;
    }
  }

  addXp(amount: number): number {
    this.xp += amount;
    let levels = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      levels += 1;
      this.xpToNext = Math.floor(
        PLAYER.xpToLevelBase * Math.pow(PLAYER.xpToLevelGrowth, this.level - 1),
      );
    }
    return levels;
  }
}
