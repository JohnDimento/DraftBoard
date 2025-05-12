import { apiRequest } from './queryClient';

// Store the league ID globally
export const LEAGUE_ID = '1180257270885261312';

// Player interface from Sleeper API
export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  team: string | null;
  college: string;
  years_exp: number;
  fantasy_positions: string[];
  number: number | null;
  stats?: Record<string, any>;
}

// League interface from Sleeper API
export interface SleeperLeague {
  league_id: string;
  name: string;
  total_rosters: number;
  status: string;
  season: string;
  settings: Record<string, any>;
  scoring_settings: Record<string, any>;
  roster_positions: string[];
  previous_league_id: string | null;
  draft_id: string | null;
}

// User interface from Sleeper API
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
}

// Roster interface from Sleeper API
export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[] | null;
  settings: {
    wins: number;
    waiver_position: number;
    waiver_budget_used: number;
    total_moves: number;
    ties: number;
    losses: number;
    fpts_decimal: number;
    fpts_against_decimal: number;
    fpts_against: number;
    fpts: number;
  };
}

// Draft interface from Sleeper API
export interface SleeperDraft {
  draft_id: string;
  league_id: string;
  status: string;
  season: string;
  settings: {
    rounds: number;
    slots_wr: number;
    slots_te: number;
    slots_super_flex: number;
    slots_rb: number;
    slots_qb: number;
    slots_lb: number;
    slots_k: number;
    slots_idp_flex: number;
    slots_flex: number;
    slots_dl: number;
    slots_def: number;
    slots_db: number;
    slots_bn: number;
    player_type: number;
    pick_timer: number;
    nomination_timer: number;
    max_flex_te: number;
    max_flex_rb: number;
    enforce_position_limits: number;
    cpu_autopick: number;
    alpha_sort: number;
  };
  metadata: Record<string, any>;
  last_picked: number;
  draft_order: Record<string, number>;
  slot_to_user_id: Record<string, string>;
  draft_type: string;
}

// Draft Pick interface from Sleeper API
export interface SleeperDraftPick {
  player_id: string;
  picked_by: string;
  pick_no: number;
  metadata: Record<string, any>;
  roster_id: number;
  draft_slot: number;
  round: number;
  draft_id: string;
}

/**
 * Fetch league information from Sleeper API
 */
export async function fetchLeague(): Promise<SleeperLeague> {
  try {
    const response = await fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}`);
    if (!response.ok) {
      throw new Error('Failed to fetch league information');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching league:', error);
    throw error;
  }
}

/**
 * Fetch users in the league from Sleeper API
 */
export async function fetchLeagueUsers(): Promise<SleeperUser[]> {
  try {
    const response = await fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch league users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching league users:', error);
    throw error;
  }
}

/**
 * Fetch rosters in the league from Sleeper API
 */
export async function fetchLeagueRosters(): Promise<SleeperRoster[]> {
  try {
    const response = await fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`);
    if (!response.ok) {
      throw new Error('Failed to fetch league rosters');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching league rosters:', error);
    throw error;
  }
}

/**
 * Fetch draft information from Sleeper API
 */
export async function fetchDraft(draftId: string): Promise<SleeperDraft> {
  try {
    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch draft information');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft:', error);
    throw error;
  }
}

/**
 * Fetch draft picks from Sleeper API
 */
export async function fetchDraftPicks(draftId: string): Promise<SleeperDraftPick[]> {
  try {
    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
    if (!response.ok) {
      throw new Error('Failed to fetch draft picks');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft picks:', error);
    throw error;
  }
}

/**
 * Fetch player information from Sleeper API
 * This returns a large object with all players, so we'll cache it
 */
let playersCache: Record<string, SleeperPlayer> = {};

export async function fetchPlayers(): Promise<Record<string, SleeperPlayer>> {
  if (Object.keys(playersCache).length > 0) {
    return playersCache;
  }
  
  try {
    const response = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!response.ok) {
      throw new Error('Failed to fetch players');
    }
    
    const data = await response.json();
    playersCache = data || {};
    return playersCache;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
}

/**
 * Get a player by ID from the cache or fetch if needed
 */
export async function getPlayerById(playerId: string): Promise<SleeperPlayer | null> {
  const players = await fetchPlayers();
  return players[playerId] || null;
}

/**
 * Fetch rookies only from the players data
 */
export async function fetchRookies(): Promise<SleeperPlayer[]> {
  const players = await fetchPlayers();
  
  // Filter for rookies (years_exp === 0) at key fantasy positions
  const rookies = Object.values(players).filter(player => 
    player.years_exp === 0 && 
    player.position && 
    ['QB', 'RB', 'WR', 'TE'].includes(player.position)
  );
  
  // Sort by position importance and name
  return rookies.sort((a, b) => {
    // First sort by position importance
    const positionOrder = { 'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4 };
    const posA = positionOrder[a.position as keyof typeof positionOrder] || 999;
    const posB = positionOrder[b.position as keyof typeof positionOrder] || 999;
    
    if (posA !== posB) {
      return posA - posB;
    }
    
    // Then sort by full name
    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Map Sleeper league data to our app's format
 */
export async function mapSleeperDataToAppFormat() {
  try {
    // Fetch all the data we need
    const league = await fetchLeague();
    const users = await fetchLeagueUsers();
    const rosters = await fetchLeagueRosters();
    const rookies = await fetchRookies();
    
    // If the league has a draft, fetch draft data too
    let draft = null;
    let draftPicks: SleeperDraftPick[] = [];
    
    if (league.draft_id) {
      draft = await fetchDraft(league.draft_id);
      // Only fetch picks if the draft has started
      if (draft.status !== 'pre_draft') {
        draftPicks = await fetchDraftPicks(league.draft_id);
      }
    }
    
    // Get draft order from the draft object
    const draftOrder = draft?.draft_order || {};
    
    // Map users to teams with correct draft positions
    const teams = rosters.map(roster => {
      const user = users.find(u => u.user_id === roster.owner_id);
      const draftPosition = user?.user_id ? draftOrder[user.user_id] : null;
      
      return {
        id: roster.roster_id,
        name: user?.display_name || `Team ${roster.roster_id}`,
        userId: roster.owner_id,
        avatar: user?.avatar || '',
        draftPosition: draftPosition || roster.roster_id,
      };
    });
    
    // Sort teams by draft position for consistent ordering
    teams.sort((a, b) => (a.draftPosition || 999) - (b.draftPosition || 999));
    
    // Map rookies to players in our format
    const players = rookies.map((rookie, index) => ({
      id: index + 1, // We need numeric IDs for our app
      sleeperPlayerId: rookie.player_id,
      name: `${rookie.first_name} ${rookie.last_name}`,
      position: rookie.position,
      school: rookie.college || 'Unknown',
      grade: determineDefaultGrade(rookie.position), // More logical default grades based on position
      tier: determineDefaultTier(rookie.position), // Default tier based on position
      notes: '',
      order: index + 1,
    }));
    
    // Map draft picks if available
    const draftHistory = draftPicks.map(pick => {
      const player = players.find(p => p.sleeperPlayerId === pick.player_id);
      if (!player) return null;
      
      return {
        id: pick.pick_no,
        pickNumber: pick.pick_no,
        round: pick.round,
        teamId: pick.roster_id,
        player: player,
      };
    }).filter(Boolean) as any[];
    
    return {
      league,
      teams,
      players,
      draftHistory,
      numberOfRounds: draft?.settings.rounds || 4,
    };
  } catch (error) {
    console.error('Error mapping Sleeper data:', error);
    throw error;
  }
}

// Helper function to determine default grade based on position
function determineDefaultGrade(position: string): number {
  switch (position) {
    case 'QB': return 80; // QBs tend to be valued higher in dynasty
    case 'RB': return 78; // RBs are also highly valued
    case 'WR': return 76; // WRs slightly below RBs
    case 'TE': return 72; // TEs typically valued less
    default: return 75;
  }
}

// Helper function to determine default tier based on position
function determineDefaultTier(position: string): number {
  // For simplicity, we'll use the same tier for all positions initially
  // This could be expanded to be more sophisticated
  return 3; // Default to tier 3 (middle tier)
}