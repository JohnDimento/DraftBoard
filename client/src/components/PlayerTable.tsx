import React from 'react';
import { useState, useRef } from 'react';
import { Player, TIERS, TIER_COLORS, ReorderPlayerItem } from '@/lib/draftBoardTypes';
import { GripVertical, Edit2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PlayerTableProps {
  players: Player[];
  onOpenNotes: (player: Player) => void;
  onUpdateGrade: (playerId: number, grade: number) => Promise<void>;
  onUpdateTier: (playerId: number, tier: number) => Promise<void>;
  onReorderPlayers: (updates: ReorderPlayerItem[]) => Promise<void>;
  isReordering: boolean;
}

export default function PlayerTable({
  players,
  onOpenNotes,
  onUpdateGrade,
  onUpdateTier,
  onReorderPlayers,
  isReordering,
}: PlayerTableProps) {
  const { toast } = useToast();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [gradeValue, setGradeValue] = useState<string>('');

  const handleDragStart = (position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const draggedItemIndex = players.findIndex(player => player.order === dragItem.current);
    const dragOverItemIndex = players.findIndex(player => player.order === dragOverItem.current);
    
    if (draggedItemIndex === -1 || dragOverItemIndex === -1) return;

    // Create a copy of the players array
    const playersCopy = [...players];
    
    // Get the dragged item
    const draggedItem = playersCopy[draggedItemIndex];
    
    // Remove the dragged item from the array
    playersCopy.splice(draggedItemIndex, 1);
    
    // Insert the dragged item at the new position
    playersCopy.splice(dragOverItemIndex, 0, draggedItem);
    
    // Update the order property for all affected players
    const updates: ReorderPlayerItem[] = playersCopy.map((player, index) => ({
      id: player.id,
      order: index + 1,
    }));
    
    try {
      await onReorderPlayers(updates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder players",
        variant: "destructive",
      });
    }
    
    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleGradeEdit = (player: Player) => {
    setEditingGradeId(player.id);
    setGradeValue(player.grade.toString());
  };

  const handleGradeBlur = async () => {
    if (editingGradeId === null) return;
    
    const grade = parseInt(gradeValue);
    
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast({
        title: "Invalid Grade",
        description: "Grade must be a number between 0 and 100",
        variant: "destructive",
      });
      
      // Reset to original value
      const player = players.find(p => p.id === editingGradeId);
      if (player) {
        setGradeValue(player.grade.toString());
      }
    } else {
      try {
        await onUpdateGrade(editingGradeId, grade);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update grade",
          variant: "destructive",
        });
      }
    }
    
    setEditingGradeId(null);
  };

  const handleGradeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGradeBlur();
    }
  };

  const handleTierChange = async (playerId: number, value: string) => {
    const tier = parseInt(value);
    
    try {
      await onUpdateTier(playerId, tier);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tier",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="lg:w-3/4 lg:mr-6 bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Pos</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">School</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Grade</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Tier</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Injury Status</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player) => (
              <tr 
                key={player.id} 
                className={`hover:bg-gray-50 ${TIER_COLORS[player.tier as keyof typeof TIER_COLORS]}`}
                draggable={!isReordering}
                onDragStart={() => handleDragStart(player.order)}
                onDragEnter={() => handleDragEnter(player.order)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="cursor-move mr-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </span>
                    <span className="font-medium">{player.order}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium">{player.name}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full position-${player.position}`}>
                    {player.position}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{player.school}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {editingGradeId === player.id ? (
                    <input
                      type="text"
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-12"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(e.target.value)}
                      onBlur={handleGradeBlur}
                      onKeyDown={handleGradeKeyDown}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="text-sm cursor-pointer flex items-center"
                      onClick={() => handleGradeEdit(player)}
                    >
                      {player.grade}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Select 
                    defaultValue={player.tier.toString()} 
                    onValueChange={(value) => handleTierChange(player.id, value)}
                  >
                    <SelectTrigger className="text-sm bg-transparent border-none w-20 p-0 h-auto">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id.toString()}>
                          {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{player.injuryStatus}</td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-secondary hover:text-blue-900"
                    onClick={() => onOpenNotes(player)}
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No players found. Add players or adjust your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
