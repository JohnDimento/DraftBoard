import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Player, POSITIONS, TIER_COLORS } from '@/lib/draftBoardTypes';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import AddPlayerModal from '@/components/AddPlayerModal';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Undo2 } from 'lucide-react';

export default function LiveDraft() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [draftHistory, setDraftHistory] = useState<{
    id: number;
    player: Player;
    teamId: number;
    pickNumber: number;
  }[]>([]);
  const [pickCounter, setPickCounter] = useState(1);
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: 'Team 1' },
    { id: 2, name: 'Team 2' },
    { id: 3, name: 'Team 3' },
    { id: 4, name: 'Team 4' },
    { id: 5, name: 'Team 5' },
    { id: 6, name: 'Team 6' },
    { id: 7, name: 'Team 7' },
    { id: 8, name: 'Team 8' },
    { id: 9, name: 'Team 9' },
    { id: 10, name: 'Team 10' },
    { id: 11, name: 'Team 11' },
    { id: 12, name: 'Team 12' },
  ]);
  const [teamEditing, setTeamEditing] = useState<number | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');

  // Get all available players
  const playersQuery = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  // Add player mutation
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

  // Filter available players
  const availablePlayers = playersQuery.data 
    ? playersQuery.data
        .filter(player => !draftHistory.some(pick => pick.player.id === player.id))
        .filter(player => 
          searchTerm ? 
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.school.toLowerCase().includes(searchTerm.toLowerCase())
          : true
        )
        .filter(player => filterPosition === 'all' ? true : player.position === filterPosition)
        .sort((a, b) => a.order - b.order)
    : [];

  // Logic to determine which team is on the clock
  useEffect(() => {
    // Simple snake draft logic
    const round = Math.ceil(pickCounter / teams.length);
    const pickInRound = pickCounter - (round - 1) * teams.length;
    
    // If odd round, go forward; if even round, go backward
    const teamOnClock = round % 2 === 1 
      ? pickInRound
      : teams.length - pickInRound + 1;
    
    setSelectedTeamId(teamOnClock);
  }, [pickCounter, teams.length]);

  // Draft a player
  const draftPlayer = (player: Player) => {
    setDraftHistory(prev => [
      {
        id: pickCounter,
        player,
        teamId: selectedTeamId,
        pickNumber: pickCounter
      },
      ...prev
    ]);
    setPickCounter(prev => prev + 1);
    
    toast({
      title: "Player Drafted",
      description: `${player.name} drafted by ${teams.find(t => t.id === selectedTeamId)?.name}`,
    });
  };

  // Undo last pick
  const undoLastPick = () => {
    if (draftHistory.length === 0) return;
    
    setDraftHistory(prev => prev.slice(1));
    setPickCounter(prev => prev - 1);
    
    toast({
      title: "Pick Undone",
      description: "Last pick has been undone",
    });
  };

  // Edit team name
  const startEditingTeam = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setTeamEditing(teamId);
      setTeamNameInput(team.name);
    }
  };

  const saveTeamName = () => {
    if (!teamNameInput.trim() || !teamEditing) return;
    
    setTeams(prev => prev.map(team => 
      team.id === teamEditing ? { ...team, name: teamNameInput } : team
    ));
    setTeamEditing(null);
  };

  // Team's drafted players
  const getTeamPlayers = (teamId: number) => {
    return draftHistory
      .filter(pick => pick.teamId === teamId)
      .sort((a, b) => a.pickNumber - b.pickNumber);
  };

  if (playersQuery.isError) {
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
        onExport={() => {}} 
        pageName="Live Draft Tracker"
      />
      
      {/* Draft Controls */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col sm:flex-row items-center mb-3 md:mb-0 gap-2">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">On the Clock:</span>
              <Badge variant="outline" className={`font-bold px-4 py-1 bg-primary/10 text-primary`}>
                {teams.find(t => t.id === selectedTeamId)?.name || `Team ${selectedTeamId}`}
              </Badge>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Pick:</span>
              <Badge variant="outline" className="px-3 py-1">
                {pickCounter}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={undoLastPick}
              disabled={draftHistory.length === 0}
              className="ml-2"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo Pick
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-40 sm:w-auto text-sm"
              placeholder="Search players..."
            />
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-32 text-sm">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Main Draft Area */}
      <div className="flex-grow container mx-auto px-4 py-4 flex flex-col lg:flex-row">
        {/* Available Players */}
        <div className="lg:w-7/12 pr-0 lg:pr-4 mb-6 lg:mb-0">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Available Players</h2>
              <span className="text-sm text-gray-500">{availablePlayers.length} Players</span>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playersQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <span className="text-sm text-gray-500">Loading players...</span>
                      </TableCell>
                    </TableRow>
                  ) : availablePlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <p className="text-sm text-gray-500">No available players match your criteria</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    availablePlayers.map((player) => (
                      <TableRow key={player.id} className={`${TIER_COLORS[player.tier as keyof typeof TIER_COLORS]}`}>
                        <TableCell>{player.order}</TableCell>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full position-${player.position}`}>
                            {player.position}
                          </span>
                        </TableCell>
                        <TableCell>{player.school}</TableCell>
                        <TableCell>{player.grade}</TableCell>
                        <TableCell>Tier {player.tier}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => draftPlayer(player)}
                            className="h-8 w-8 p-0 text-primary"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        {/* Draft History and Team Rosters */}
        <div className="lg:w-5/12">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Recent Picks</h2>
            </div>
            <div className="overflow-auto max-h-[240px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Pick</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Pos</TableHead>
                    <TableHead>Team</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center">
                        <p className="text-sm text-gray-500">No players drafted yet</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    draftHistory.map((pick) => (
                      <TableRow key={pick.id}>
                        <TableCell>{pick.pickNumber}</TableCell>
                        <TableCell className="font-medium">{pick.player.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full position-${pick.player.position}`}>
                            {pick.player.position}
                          </span>
                        </TableCell>
                        <TableCell>{teams.find(t => t.id === pick.teamId)?.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Team Rosters */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Team Rosters</h2>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-600px)]">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    className={`p-3 border rounded-md ${team.id === selectedTeamId ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      {teamEditing === team.id ? (
                        <div className="flex items-center w-full">
                          <Input
                            value={teamNameInput}
                            onChange={(e) => setTeamNameInput(e.target.value)}
                            className="text-sm h-7"
                            autoFocus
                            onBlur={saveTeamName}
                            onKeyDown={(e) => e.key === 'Enter' && saveTeamName()}
                          />
                        </div>
                      ) : (
                        <h3 
                          className="font-medium text-sm cursor-pointer hover:text-primary"
                          onClick={() => startEditingTeam(team.id)}
                        >
                          {team.name}
                        </h3>
                      )}
                      <span className="text-xs text-gray-500">
                        {getTeamPlayers(team.id).length} players
                      </span>
                    </div>
                    <div className="space-y-1">
                      {getTeamPlayers(team.id).map((pick) => (
                        <div key={pick.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center">
                            <span className={`inline-block w-6 h-5 text-center mr-1 rounded position-${pick.player.position}`}>
                              {pick.player.position}
                            </span>
                            <span>{pick.player.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AddPlayerModal 
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onAddPlayer={addPlayerMutation.mutateAsync}
        isSubmitting={addPlayerMutation.isPending}
      />
    </div>
  );
}