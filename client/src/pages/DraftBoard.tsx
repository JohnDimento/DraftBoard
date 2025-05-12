import { useState } from 'react';
import { useDraftBoard } from '@/hooks/useDraftBoard';
import { Player } from '@/lib/draftBoardTypes';
import Header from '@/components/Header';
import Controls from '@/components/Controls';
import PlayerTable from '@/components/PlayerTable';
import PlayerNotes from '@/components/PlayerNotes';
import AddPlayerModal from '@/components/AddPlayerModal';
import { Loader2 } from 'lucide-react';

export default function DraftBoard() {
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  
  const {
    filteredPlayers,
    isLoading,
    isError,
    selectedPlayer,
    setSelectedPlayerId,
    filterOptions,
    setFilterOptions,
    sortOption,
    setSortOption,
    addPlayer,
    updatePlayer,
    reorderPlayers,
    exportToCsv,
    isAddingPlayer,
    isUpdatingPlayer,
    isReorderingPlayers,
  } = useDraftBoard();

  const handleOpenNotesPanel = (player: Player) => {
    setSelectedPlayerId(player.id);
  };

  const handleUpdateNotes = async (notes: string) => {
    if (selectedPlayer) {
      await updatePlayer({
        id: selectedPlayer.id,
        data: { notes }
      });
    }
  };

  const handleUpdateGrade = async (playerId: number, grade: number) => {
    await updatePlayer({
      id: playerId,
      data: { grade }
    });
  };

  const handleUpdateTier = async (playerId: number, tier: number) => {
    await updatePlayer({
      id: playerId,
      data: { tier }
    });
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Draft Board</h2>
          <p className="text-gray-600">An error occurred while loading the player data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onAddPlayer={() => setIsAddPlayerModalOpen(true)} 
        onExport={exportToCsv} 
      />
      
      <Controls 
        filterOptions={filterOptions}
        setFilterOptions={setFilterOptions}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />
      
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          <span className="ml-2 text-gray-600">Loading players...</span>
        </div>
      ) : (
        <main className="flex-grow container mx-auto px-4 py-6 flex flex-col-reverse lg:flex-row">
          <PlayerTable 
            players={filteredPlayers}
            onOpenNotes={handleOpenNotesPanel}
            onUpdateGrade={handleUpdateGrade}
            onUpdateTier={handleUpdateTier}
            onReorderPlayers={reorderPlayers}
            isReordering={isReorderingPlayers}
          />
          
          <PlayerNotes 
            player={selectedPlayer}
            onUpdateNotes={handleUpdateNotes}
            isUpdating={isUpdatingPlayer}
          />
        </main>
      )}
      
      <AddPlayerModal 
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onAddPlayer={addPlayer}
        isSubmitting={isAddingPlayer}
      />
    </div>
  );
}
