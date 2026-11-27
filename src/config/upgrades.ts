import type { CharacterId } from './characters';

export type UpgradeId =
  | 'damage'
  | 'count'
  | 'firerate'
  | 'pierce'
  | 'movespeed'
  | 'maxhp'
  | 'magnet'
  | 'area'
  | 'orbit'
  | 'aura'
  | 'crit'
  | 'regen';

export interface UpgradeDef {
  id: UpgradeId;
  title: string;
  description: string;
  maxStacks: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'damage',
    title: '锋刃强化',
    description: '武器伤害 +25%',
    maxStacks: 8,
  },
  {
    id: 'count',
    title: '分裂弹幕',
    description: '弹道数量 +1',
    maxStacks: 5,
  },
  {
    id: 'firerate',
    title: '连射加速',
    description: '攻击冷却 -12%',
    maxStacks: 6,
  },
  {
    id: 'pierce',
    title: '穿透斩击',
    description: '弹道穿透 +1',
    maxStacks: 4,
  },
  {
    id: 'movespeed',
    title: '疾风步伐',
    description: '移动速度 +10%',
    maxStacks: 5,
  },
  {
    id: 'maxhp',
    title: '生命扩容',
    description: '最大生命 +20 并回满差额',
    maxStacks: 6,
  },
  {
    id: 'magnet',
    title: '拾取磁铁',
    description: '经验吸附范围 +40%',
    maxStacks: 5,
  },
  {
    id: 'area',
    title: '刃域扩大',
    description: '弹道 / 光环体积 +20%',
    maxStacks: 5,
  },
  {
    id: 'orbit',
    title: '星刃环绕',
    description: '环绕刃 +1（未拥有则解锁）',
    maxStacks: 6,
  },
  {
    id: 'aura',
    title: '焚场光环',
    description: '光环伤害与半径增强（未拥有则解锁）',
    maxStacks: 6,
  },
  {
    id: 'crit',
    title: '致命一击',
    description: '暴击率 +8%',
    maxStacks: 5,
  },
  {
    id: 'regen',
    title: '生命回流',
    description: '每秒回复 +1 生命',
    maxStacks: 5,
  },
];

/** Higher weight = more likely for that character's build. */
const AFFINITY: Record<CharacterId, Partial<Record<UpgradeId, number>>> = {
  knight: {
    damage: 3,
    pierce: 2.5,
    firerate: 2,
    maxhp: 2.5,
    regen: 2,
    crit: 1.5,
  },
  mage: {
    orbit: 4.5,
    area: 3,
    damage: 2.5,
    pierce: 2,
    magnet: 2,
    crit: 2,
  },
  ranger: {
    count: 4,
    firerate: 3.5,
    movespeed: 3.5,
    crit: 3,
    pierce: 2,
    damage: 2,
  },
  berserker: {
    aura: 4.5,
    area: 3.5,
    damage: 3,
    maxhp: 2.5,
    regen: 2.5,
    crit: 2,
  },
};

export function isPreferredUpgrade(
  characterId: CharacterId,
  upgradeId: UpgradeId,
): boolean {
  return (AFFINITY[characterId]?.[upgradeId] ?? 1) >= 2.5;
}

export function pickUpgradeChoices(
  stacks: Record<UpgradeId, number>,
  count = 3,
  characterId: CharacterId = 'knight',
): UpgradeDef[] {
  const available = UPGRADES.filter((u) => stacks[u.id] < u.maxStacks);
  const pool = available.length > 0 ? available : UPGRADES;
  const weights = AFFINITY[characterId] ?? {};

  const picked: UpgradeDef[] = [];
  const remaining = [...pool];

  while (picked.length < Math.min(count, remaining.length)) {
    let total = 0;
    const weighted = remaining.map((u) => {
      const w = weights[u.id] ?? 1;
      total += w;
      return { u, w };
    });
    let roll = Math.random() * total;
    let chosenIdx = 0;
    for (let i = 0; i < weighted.length; i += 1) {
      roll -= weighted[i]!.w;
      if (roll <= 0) {
        chosenIdx = i;
        break;
      }
    }
    picked.push(remaining[chosenIdx]!);
    remaining.splice(chosenIdx, 1);
  }

  return picked;
}
