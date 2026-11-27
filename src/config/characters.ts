export type CharacterId = 'knight' | 'mage' | 'ranger' | 'berserker';

export type WeaponKind = 'bolt' | 'scatter' | 'orbit' | 'aura';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  assetKey: string;
  primaryWeapon: WeaponKind;
  /** Secondary weapon unlocked at start (optional). */
  secondaryWeapon?: WeaponKind;
  maxHp: number;
  speed: number;
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  pierce: number;
  projectileRadius: number;
  projectileSpeed: number;
  pickupRadius: number;
  orbitCount: number;
  orbitRadius: number;
  auraRadius: number;
  auraDamage: number;
  critChance: number;
  accent: string;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'knight',
    name: '守望骑士',
    title: '均衡先锋',
    description: '自动飞刃射击，生存均衡，适合入门。',
    assetKey: 'player_knight',
    primaryWeapon: 'bolt',
    maxHp: 120,
    speed: 170,
    damage: 14,
    cooldownMs: 420,
    projectileCount: 1,
    pierce: 0,
    projectileRadius: 7,
    projectileSpeed: 360,
    pickupRadius: 96,
    orbitCount: 0,
    orbitRadius: 70,
    auraRadius: 0,
    auraDamage: 0,
    critChance: 0.05,
    accent: '#4fd1c5',
  },
  {
    id: 'mage',
    name: '星环法师',
    title: '环绕割草',
    description: '开局旋转星刃环绕清怪，脆皮高伤。',
    assetKey: 'player_mage',
    primaryWeapon: 'orbit',
    secondaryWeapon: 'bolt',
    maxHp: 85,
    speed: 165,
    damage: 11,
    cooldownMs: 700,
    projectileCount: 1,
    pierce: 1,
    projectileRadius: 6,
    projectileSpeed: 300,
    pickupRadius: 110,
    orbitCount: 3,
    orbitRadius: 78,
    auraRadius: 0,
    auraDamage: 0,
    critChance: 0.08,
    accent: '#b388ff',
  },
  {
    id: 'ranger',
    name: '疾风游侠',
    title: '散射收割',
    description: '高速移动 + 散射弹幕，靠走位输出。',
    assetKey: 'player_ranger',
    primaryWeapon: 'scatter',
    maxHp: 90,
    speed: 205,
    damage: 10,
    cooldownMs: 360,
    projectileCount: 3,
    pierce: 0,
    projectileRadius: 5,
    projectileSpeed: 420,
    pickupRadius: 100,
    orbitCount: 0,
    orbitRadius: 70,
    auraRadius: 0,
    auraDamage: 0,
    critChance: 0.12,
    accent: '#7cf29c',
  },
  {
    id: 'berserker',
    name: '赤焰狂战',
    title: '近身焚场',
    description: '烈焰光环持续灼烧，近战越打越狠。',
    assetKey: 'player_berserker',
    primaryWeapon: 'aura',
    secondaryWeapon: 'bolt',
    maxHp: 110,
    speed: 180,
    damage: 12,
    cooldownMs: 520,
    projectileCount: 1,
    pierce: 0,
    projectileRadius: 8,
    projectileSpeed: 280,
    pickupRadius: 92,
    orbitCount: 0,
    orbitRadius: 70,
    // Tuned down: early aura was full-HP clearing too easily.
    auraRadius: 58,
    auraDamage: 5,
    critChance: 0.1,
    accent: '#ff6b6b',
  },
];

export function getCharacter(id: CharacterId): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]!;
}
