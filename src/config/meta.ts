import type { CharacterId } from './characters';

const STORAGE_KEY = 'mowing_meta_v1';

export interface MetaProgress {
  runs: number;
  wins: number;
  bestKills: number;
  /** Characters that earned a starter weapon boost. */
  starterBoosts: CharacterId[];
  /** Characters that unlocked an alt tint skin. */
  tintSkins: CharacterId[];
  /** Total lifetime kills (for soft unlocks). */
  totalKills: number;
}

const DEFAULT_META: MetaProgress = {
  runs: 0,
  wins: 0,
  bestKills: 0,
  starterBoosts: [],
  tintSkins: [],
  totalKills: 0,
};

export function loadMeta(): MetaProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_META, starterBoosts: [], tintSkins: [] };
    const parsed = JSON.parse(raw) as Partial<MetaProgress>;
    return {
      runs: parsed.runs ?? 0,
      wins: parsed.wins ?? 0,
      bestKills: parsed.bestKills ?? 0,
      starterBoosts: parsed.starterBoosts ?? [],
      tintSkins: parsed.tintSkins ?? [],
      totalKills: parsed.totalKills ?? 0,
    };
  } catch {
    return { ...DEFAULT_META, starterBoosts: [], tintSkins: [] };
  }
}

export function saveMeta(meta: MetaProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function hasStarterBoost(meta: MetaProgress, id: CharacterId): boolean {
  return meta.starterBoosts.includes(id);
}

export function hasTintSkin(meta: MetaProgress, id: CharacterId): boolean {
  return meta.tintSkins.includes(id);
}

export interface RunRecordInput {
  characterId: CharacterId;
  won: boolean;
  kills: number;
  elapsedMs: number;
  level: number;
}

/**
 * Record a finished run and unlock light meta rewards.
 * - Survive ≥2 min or win → starter boost for that character
 * - Win → alt tint skin for that character
 */
export function recordRun(input: RunRecordInput): {
  meta: MetaProgress;
  unlockedBoost: boolean;
  unlockedTint: boolean;
} {
  const meta = loadMeta();
  meta.runs += 1;
  if (input.won) meta.wins += 1;
  meta.bestKills = Math.max(meta.bestKills, input.kills);
  meta.totalKills += input.kills;

  let unlockedBoost = false;
  let unlockedTint = false;

  const qualifyBoost = input.won || input.elapsedMs >= 2 * 60_000 || input.kills >= 40;
  if (qualifyBoost && !meta.starterBoosts.includes(input.characterId)) {
    meta.starterBoosts.push(input.characterId);
    unlockedBoost = true;
  }

  if (input.won && !meta.tintSkins.includes(input.characterId)) {
    meta.tintSkins.push(input.characterId);
    unlockedTint = true;
  }

  saveMeta(meta);
  return { meta, unlockedBoost, unlockedTint };
}
