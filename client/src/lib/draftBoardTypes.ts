// Type definitions for the draft board application

export interface Player {
  id: number;
  name: string;
  position: string;
  school: string;
  grade: number;
  tier: number;
  notes: string;
  order: number;
  injuryStatus: string;
}

export interface DraftBoardItem {
  playerId: number;
  order: number;
  tierId: number;
}

export type SortField = 'rank' | 'name' | 'position' | 'school' | 'grade' | 'tier';

export interface PlayerFormData {
  name: string;
  position: string;
  school: string;
  grade: number;
  tier: number;
  notes: string;
}

export interface ReorderPlayerItem {
  id: number;
  order: number;
}

export interface FilterOptions {
  position: string;
  tier: string;
  search: string;
}

export interface SortOption {
  field: SortField;
  direction: 'asc' | 'desc';
}

export const POSITIONS = [
  'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'DEF'
];

export const TIERS = [
  { id: 1, name: 'Tier 1' },
  { id: 2, name: 'Tier 2' },
  { id: 3, name: 'Tier 3' },
  { id: 4, name: 'Tier 4' },
  { id: 5, name: 'Tier 5' }
];

export const TIER_COLORS = {
  1: 'tier-1',
  2: 'tier-2',
  3: 'tier-3',
  4: 'tier-4',
  5: 'tier-5'
};

export const DEFAULT_PLAYER: PlayerFormData = {
  name: '',
  position: '',
  school: '',
  grade: 75,
  tier: 3,
  notes: ''
};
