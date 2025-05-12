import { useState, useEffect } from 'react';
import { Player } from '@/lib/draftBoardTypes';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PlayerNotesProps {
  player: Player | null;
  onUpdateNotes: (notes: string) => Promise<void>;
  isUpdating: boolean;
}

export default function PlayerNotes({ player, onUpdateNotes, isUpdating }: PlayerNotesProps) {
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Update notes state when player changes
  useEffect(() => {
    if (player) {
      setNotes(player.notes || '');
    } else {
      setNotes('');
    }
  }, [player]);
  
  // Auto-save notes after a delay
  useEffect(() => {
    if (!player) return;
    
    const timer = setTimeout(() => {
      if (player.notes !== notes) {
        handleSaveNotes();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [notes, player]);
  
  const handleSaveNotes = async () => {
    if (!player) return;
    
    try {
      await onUpdateNotes(notes);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };
  
  const formatLastSaved = () => {
    if (!lastSaved) return 'Not saved yet';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return lastSaved.toLocaleTimeString();
    }
  };
  
  return (
    <div className="lg:w-1/4 bg-white shadow-md rounded-lg p-4 mb-6 lg:mb-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Player Notes</h2>
        <span className="text-xs text-gray-500 italic">Auto-saved</span>
      </div>
      
      {!player ? (
        <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md">
          <p className="text-gray-500 text-sm">Select a player to view or edit notes</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-3">
            <span className="text-sm font-medium mr-2">{player.name}</span>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full position-${player.position}`}>
              {player.position}
            </span>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-56 p-3 text-sm border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary"
            placeholder="Add player notes here..."
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 italic">
              {isUpdating ? 'Saving...' : `Last saved: ${formatLastSaved()}`}
            </span>
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={isUpdating || player.notes === notes}
              className="bg-secondary hover:bg-blue-600 text-white"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
