import { 
  Player, 
  InsertPlayer, 
  UpdatePlayer, 
  ReorderPlayers
} from "@shared/schema";

export interface IStorage {
  // Player operations
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, data: UpdatePlayer): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  
  // Reordering operations
  reorderPlayers(updates: ReorderPlayers): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private currentId: number;
  
  constructor() {
    this.players = new Map();
    this.currentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const samplePlayers: InsertPlayer[] = [
      { name: "Caleb Williams", position: "QB", school: "USC", grade: 95, tier: 1, notes: "Outstanding arm talent with mobility to extend plays. Natural leader with high football IQ.", order: 1 },
      { name: "Marvin Harrison Jr.", position: "WR", school: "Ohio State", grade: 94, tier: 1, notes: "Elite size-speed combination with exceptional route-running skills.", order: 2 },
      { name: "Jayden Daniels", position: "QB", school: "LSU", grade: 91, tier: 2, notes: "Dynamic dual-threat QB with improved passing accuracy.", order: 3 },
      { name: "Malik Nabers", position: "WR", school: "LSU", grade: 89, tier: 2, notes: "Explosive playmaker with excellent after-the-catch ability.", order: 4 },
      { name: "Brock Bowers", position: "TE", school: "Georgia", grade: 86, tier: 3, notes: "Athletic tight end with receiver-like skills.", order: 5 },
      { name: "Rome Odunze", position: "WR", school: "Washington", grade: 83, tier: 3, notes: "Great size and reliable hands. Polished route-runner.", order: 6 },
      { name: "Drake Maye", position: "QB", school: "North Carolina", grade: 79, tier: 4, notes: "Good arm talent but needs more consistency.", order: 7 },
      { name: "Jonathon Brooks", position: "RB", school: "Texas", grade: 72, tier: 5, notes: "Solid all-around back with good vision.", order: 8 },
    ];
    
    samplePlayers.forEach(player => {
      this.createPlayer(player);
    });
  }
  
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values()).sort((a, b) => a.order - b.order);
  }
  
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentId++;
    
    // If order is not provided, place at the end
    if (!insertPlayer.order) {
      const players = Array.from(this.players.values());
      const maxOrder = players.length > 0 
        ? Math.max(...players.map(p => p.order)) 
        : 0;
      insertPlayer.order = maxOrder + 1;
    }
    
    const player: Player = { ...insertPlayer, id };
    this.players.set(id, player);
    return player;
  }
  
  async updatePlayer(id: number, data: UpdatePlayer): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...data };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  async deletePlayer(id: number): Promise<boolean> {
    if (!this.players.has(id)) return false;
    
    // Get the player to be deleted and all other players
    const deletedPlayer = this.players.get(id)!;
    this.players.delete(id);
    
    // Update order of players after the deleted one
    const playersToUpdate = Array.from(this.players.values())
      .filter(p => p.order > deletedPlayer.order)
      .map(p => ({ ...p, order: p.order - 1 }));
    
    playersToUpdate.forEach(p => this.players.set(p.id, p));
    
    return true;
  }
  
  async reorderPlayers(updates: ReorderPlayers): Promise<boolean> {
    for (const update of updates) {
      const player = this.players.get(update.id);
      if (player) {
        this.players.set(player.id, { ...player, order: update.order });
      }
    }
    return true;
  }
}

export const storage = new MemStorage();
