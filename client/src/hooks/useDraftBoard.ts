import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Player, FilterOptions, SortOption, ReorderPlayerItem } from '@/lib/draftBoardTypes';
import { useToast } from '@/hooks/use-toast';

export function useDraftBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const playersQuery = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // States
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    position: 'all',
    tier: 'all',
    search: '',
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'rank',
    direction: 'asc',
  });
  
  // Mutations
  const addPlayerMutation = useMutation({
    mutationFn: async (player: Omit<Player, 'id'>) => {
      const res = await apiRequest('POST', '/api/players', player);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Success",
        description: "Player added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add player: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Player> }) => {
      const res = await apiRequest('PATCH', `/api/players/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update player: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deletePlayerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/players/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete player: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const reorderPlayersMutation = useMutation({
    mutationFn: async (updates: ReorderPlayerItem[]) => {
      const res = await apiRequest('POST', '/api/players/reorder', updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reorder players: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Get the selected player
  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId || !playersQuery.data) return null;
    return playersQuery.data.find(player => player.id === selectedPlayerId) || null;
  }, [selectedPlayerId, playersQuery.data]);
  
  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    if (!playersQuery.data) return [];
    
    let result = [...playersQuery.data];
    
    // Apply filters
    if (filterOptions.position !== 'all') {
      result = result.filter(player => player.position === filterOptions.position);
    }
    
    if (filterOptions.tier !== 'all') {
      result = result.filter(player => player.tier === parseInt(filterOptions.tier));
    }
    
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      result = result.filter(
        player => 
          player.name.toLowerCase().includes(searchLower) ||
          player.school.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    if (sortOption.field === 'rank') {
      result.sort((a, b) => a.order - b.order);
    } else if (sortOption.field === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption.field === 'position') {
      result.sort((a, b) => a.position.localeCompare(b.position));
    } else if (sortOption.field === 'school') {
      result.sort((a, b) => a.school.localeCompare(b.school));
    } else if (sortOption.field === 'grade') {
      result.sort((a, b) => b.grade - a.grade);
    } else if (sortOption.field === 'tier') {
      result.sort((a, b) => a.tier - b.tier);
    }
    
    // Reverse if descending
    if (sortOption.direction === 'desc' && sortOption.field !== 'grade') {
      result.reverse();
    }
    
    return result;
  }, [playersQuery.data, filterOptions, sortOption]);
  
  // Handle player reordering
  const handleReorderPlayers = async (updates: ReorderPlayerItem[]) => {
    await reorderPlayersMutation.mutateAsync(updates);
  };
  
  // Export CSV
  const exportToCsv = () => {
    if (!playersQuery.data) return;
    
    const headers = ['Rank', 'Name', 'Position', 'School', 'Grade', 'Tier', 'Notes'];
    const rows = playersQuery.data
      .sort((a, b) => a.order - b.order)
      .map(player => [
        player.order.toString(),
        player.name,
        player.position,
        player.school,
        player.grade.toString(),
        player.tier.toString(),
        player.notes.replace(/"/g, '""') // Escape quotes
      ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'draft_board.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return {
    // Queries
    players: playersQuery.data || [],
    isLoading: playersQuery.isLoading,
    isError: playersQuery.isError,
    
    // Filtered and sorted data
    filteredPlayers: filteredAndSortedPlayers,
    
    // State management
    selectedPlayer,
    setSelectedPlayerId,
    filterOptions,
    setFilterOptions,
    sortOption,
    setSortOption,
    
    // Mutations
    addPlayer: addPlayerMutation.mutateAsync,
    updatePlayer: updatePlayerMutation.mutateAsync,
    deletePlayer: deletePlayerMutation.mutateAsync,
    reorderPlayers: handleReorderPlayers,
    
    // Export
    exportToCsv,
    
    // Status
    isAddingPlayer: addPlayerMutation.isPending,
    isUpdatingPlayer: updatePlayerMutation.isPending,
    isDeletingPlayer: deletePlayerMutation.isPending,
    isReorderingPlayers: reorderPlayersMutation.isPending,
  };
}
