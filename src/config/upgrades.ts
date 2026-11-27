export type UpgradeId =
  | 'damage'
  | 'count'
  | 'firerate'
  | 'pierce'
  | 'movespeed'
  | 'maxhp'
  | 'magnet'
  | 'area';

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
    description: '弹道体积 +20%',
    maxStacks: 5,
  },
];

export function pickUpgradeChoices(
  stacks: Record<UpgradeId, number>,
  count = 3,
): UpgradeDef[] {
  const available = UPGRADES.filter((u) => stacks[u.id] < u.maxStacks);
  const pool = available.length > 0 ? available : UPGRADES;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
