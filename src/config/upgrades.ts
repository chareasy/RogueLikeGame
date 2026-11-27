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
    description: '最大生命 +20，并立即回复 20',
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
    damage: 4,
    pierce: 3.5,
    firerate: 3,
    maxhp: 3,
    regen: 2.2,
    crit: 2,
    // Off-kit heavily downweighted.
    orbit: 0.25,
    aura: 0.2,
    count: 0.45,
  },
  mage: {
    orbit: 6,
    area: 4.5,
    damage: 3,
    pierce: 2.5,
    magnet: 2,
    crit: 2.2,
    aura: 0.2,
    count: 0.35,
    movespeed: 0.5,
  },
  ranger: {
    count: 5.5,
    firerate: 4.5,
    movespeed: 4,
    crit: 3.5,
    pierce: 2.5,
    damage: 2.5,
    orbit: 0.25,
    aura: 0.2,
    maxhp: 0.6,
  },
  berserker: {
    aura: 6,
    area: 4.5,
    damage: 3.5,
    maxhp: 3,
    regen: 2.8,
    crit: 2.2,
    orbit: 0.2,
    count: 0.35,
    pierce: 0.45,
  },
};

/** Core kit cards — early level-ups bias hard toward these. */
const CORE: Record<CharacterId, UpgradeId[]> = {
  // Regen early so melee kits aren't all glass until minute 2.
  knight: ['damage', 'pierce', 'firerate', 'maxhp', 'regen'],
  mage: ['orbit', 'area', 'damage', 'pierce'],
  ranger: ['count', 'firerate', 'movespeed', 'crit'],
  berserker: ['aura', 'area', 'damage', 'maxhp', 'regen'],
};

export function isPreferredUpgrade(
  characterId: CharacterId,
  upgradeId: UpgradeId,
): boolean {
  return (AFFINITY[characterId]?.[upgradeId] ?? 0.4) >= 2.5;
}

export function isCoreUpgrade(
  characterId: CharacterId,
  upgradeId: UpgradeId,
): boolean {
  return (CORE[characterId] ?? []).includes(upgradeId);
}

function weightedPick(
  pool: UpgradeDef[],
  weights: Partial<Record<UpgradeId, number>>,
  boostCore: boolean,
  characterId: CharacterId,
): number {
  let total = 0;
  const weighted = pool.map((u) => {
    let w = weights[u.id] ?? 0.4;
    if (boostCore && isCoreUpgrade(characterId, u.id)) w *= 2.2;
    total += w;
    return w;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < weighted.length; i += 1) {
    roll -= weighted[i]!;
    if (roll <= 0) return i;
  }
  return Math.max(0, pool.length - 1);
}

export function pickUpgradeChoices(
  stacks: Record<UpgradeId, number>,
  count = 3,
  characterId: CharacterId = 'knight',
): UpgradeDef[] {
  const available = UPGRADES.filter((u) => stacks[u.id] < u.maxStacks);
  const pool = available.length > 0 ? available : UPGRADES;
  const weights = AFFINITY[characterId] ?? {};
  const picksDone = Object.values(stacks).reduce((a, b) => a + b, 0);
  // First 3 upgrade picks: force at least 2 core cards into the offer.
  const early = picksDone < 3;

  const picked: UpgradeDef[] = [];
  const remaining = [...pool];

  if (early) {
    const corePool = remaining.filter((u) => isCoreUpgrade(characterId, u.id));
    const coreNeed = Math.min(2, corePool.length, count);
    for (let i = 0; i < coreNeed; i += 1) {
      const idxInCore = weightedPick(corePool, weights, true, characterId);
      const chosen = corePool[idxInCore]!;
      picked.push(chosen);
      const remIdx = remaining.findIndex((u) => u.id === chosen.id);
      if (remIdx >= 0) remaining.splice(remIdx, 1);
      corePool.splice(idxInCore, 1);
    }
  }

  while (picked.length < Math.min(count, pool.length) && remaining.length > 0) {
    const idx = weightedPick(remaining, weights, early, characterId);
    picked.push(remaining[idx]!);
    remaining.splice(idx, 1);
  }

  // Shuffle offer order so core isn't always left-aligned.
  for (let i = picked.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = picked[i]!;
    picked[i] = picked[j]!;
    picked[j] = tmp;
  }

  return picked;
}
