import type { CharacterDef } from '../config/characters';
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

  orbitCount = 0;
  orbitRadius = 70;
  auraRadius = 0;
  auraDamage = 0;
  critChance = 0.05;
  regenPerSec = 0;

  hasBolt = true;
  hasScatter = false;
  hasOrbit = false;
  hasAura = false;

  stacks: Record<UpgradeId, number> = {
    damage: 0,
    count: 0,
    firerate: 0,
    pierce: 0,
    movespeed: 0,
    maxhp: 0,
    magnet: 0,
    area: 0,
    orbit: 0,
    aura: 0,
    crit: 0,
    regen: 0,
  };

  applyCharacter(def: CharacterDef): void {
    this.maxHp = def.maxHp;
    this.hp = def.maxHp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.cooldownMs = def.cooldownMs;
    this.projectileCount = def.projectileCount;
    this.pierce = def.pierce;
    this.projectileRadius = def.projectileRadius;
    this.projectileSpeed = def.projectileSpeed;
    this.pickupRadius = def.pickupRadius;
    this.orbitCount = def.orbitCount;
    this.orbitRadius = def.orbitRadius;
    this.auraRadius = def.auraRadius;
    this.auraDamage = def.auraDamage;
    this.critChance = def.critChance;

    this.hasBolt =
      def.primaryWeapon === 'bolt' ||
      def.primaryWeapon === 'scatter' ||
      def.secondaryWeapon === 'bolt' ||
      def.secondaryWeapon === 'scatter';
    this.hasScatter = def.primaryWeapon === 'scatter';
    this.hasOrbit =
      def.primaryWeapon === 'orbit' ||
      def.secondaryWeapon === 'orbit' ||
      def.orbitCount > 0;
    this.hasAura =
      def.primaryWeapon === 'aura' ||
      def.secondaryWeapon === 'aura' ||
      def.auraRadius > 0;
  }

  rollCritMultiplier(): number {
    return Math.random() < this.critChance ? 2 : 1;
  }

  applyUpgrade(id: UpgradeId): void {
    this.stacks[id] += 1;
    switch (id) {
      case 'damage':
        this.damage *= 1.25;
        this.auraDamage *= 1.2;
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
        this.orbitRadius *= 1.12;
        this.auraRadius = Math.max(48, this.auraRadius) * 1.15;
        break;
      case 'orbit':
        this.hasOrbit = true;
        this.orbitCount = Math.max(1, this.orbitCount) + 1;
        this.orbitRadius = Math.max(70, this.orbitRadius);
        break;
      case 'aura':
        this.hasAura = true;
        if (this.auraRadius <= 0) this.auraRadius = 64;
        else this.auraRadius *= 1.15;
        if (this.auraDamage <= 0) this.auraDamage = Math.max(6, this.damage * 0.45);
        else this.auraDamage *= 1.25;
        break;
      case 'crit':
        this.critChance = Math.min(0.6, this.critChance + 0.08);
        break;
      case 'regen':
        this.regenPerSec += 1;
        break;
    }
  }

  tickRegen(delta: number): void {
    if (this.regenPerSec <= 0 || this.hp <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + (this.regenPerSec * delta) / 1000);
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
