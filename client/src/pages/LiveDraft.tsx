import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Player, POSITIONS, TIER_COLORS } from '@/lib/draftBoardTypes';
import { apiRequest } from '@/lib/queryClient';
import { 
  LEAGUE_ID, 
  fetchLeague, 
  fetchLeagueUsers, 
  fetchDraft, 
  fetchPlayers,
  fetchRookies,
  mapSleeperDataToAppFormat
} from '@/lib/sleeperApi';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Undo2, Edit, ArrowLeftRight } from 'lucide-react';

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
  const [numberOfRounds, setNumberOfRounds] = useState(4);
  const [teams, setTeams] = useState<Array<{ id: number; name: string; userId?: string; avatar?: string }>>([
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
  
  // Trade dialog state
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [fromTeamId, setFromTeamId] = useState<number | null>(null);
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [fromPickNumbers, setFromPickNumbers] = useState<number[]>([]);
  const [toPickNumbers, setToPickNumbers] = useState<number[]>([]);
  
  // Map of traded pick numbers to their new team IDs
  const [tradedPicks, setTradedPicks] = useState<Map<number, number>>(new Map());

  // Get all available players from our API
  const playersQuery = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // Load data from Sleeper API
  const sleeperDataQuery = useQuery({
    queryKey: ['sleeper-data', LEAGUE_ID],
    queryFn: async () => {
      return await mapSleeperDataToAppFormat();
    },
    enabled: true, // Always fetch data
  });
  
  // Query for league information
  const leagueQuery = useQuery({
    queryKey: ['sleeper-league', LEAGUE_ID],
    queryFn: async () => await fetchLeague(),
    enabled: true,
  });
  
  // Query for league users
  const usersQuery = useQuery({
    queryKey: ['sleeper-users', LEAGUE_ID],
    queryFn: async () => await fetchLeagueUsers(),
    enabled: true,
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

  // Use Sleeper data when available
  useEffect(() => {
    if (sleeperDataQuery.isSuccess && sleeperDataQuery.data) {
      const { 
        teams: sleeperTeams, 
        players: sleeperPlayers, 
        numberOfRounds: rounds,
        draftHistory: sleeperDraftHistory,
        league: sleeperLeague
      } = sleeperDataQuery.data;
      
      // Update teams
      if (sleeperTeams && sleeperTeams.length > 0) {
        setTeams(sleeperTeams);
      }
      
      // Update number of rounds if available
      if (rounds) {
        setNumberOfRounds(rounds);
      }
      
      // If players are available from Sleeper and no players are loaded yet,
      // we can use the Sleeper players data
      if (sleeperPlayers && sleeperPlayers.length > 0 && 
          (!playersQuery.data || playersQuery.data.length === 0)) {
        // We'll add the Sleeper players to our database
        sleeperPlayers.forEach(player => {
          // Only add if we don't already have this player
          addPlayerMutation.mutate({
            name: player.name,
            position: player.position,
            school: player.school,
            grade: player.grade,
            tier: player.tier,
            notes: player.notes,
            order: player.order
          });
        });
      }
      
      // If we have draft history from Sleeper (this would be for in-progress drafts)
      if (sleeperDraftHistory && sleeperDraftHistory.length > 0) {
        setDraftHistory(sleeperDraftHistory);
        setPickCounter(sleeperDraftHistory.length + 1);
      }
      
      toast({
        title: "Sleeper League Connected",
        description: `Connected to ${sleeperLeague?.name || 'your Sleeper league'}`,
      });
    }
  }, [sleeperDataQuery.isSuccess, sleeperDataQuery.data, playersQuery.data]);

  // Function to load Sleeper rookies
  const loadSleeperRookies = async () => {
    if (!sleeperDataQuery.isSuccess || !sleeperDataQuery.data?.players) {
      toast({
        title: "Error",
        description: "Sleeper data not available yet. Please wait for the connection to complete.",
        variant: "destructive",
      });
      return;
    }
    
    // Get the rookies from Sleeper data
    const { players: sleeperPlayers } = sleeperDataQuery.data;
    
    // First delete all existing players (clear the draft board)
    if (playersQuery.data) {
      // We'll show a confirmation dialog here before deleting
      const confirm = window.confirm(
        "This will replace your current player list with rookies from Sleeper. Continue?"
      );
      
      if (!confirm) return;
      
      // Delete all existing players by ID
      for (const player of playersQuery.data) {
        try {
          await apiRequest('DELETE', `/api/players/${player.id}`);
        } catch (error) {
          console.error(`Failed to delete player ${player.id}:`, error);
        }
      }
    }
    
    // Now add the Sleeper rookies
    for (const player of sleeperPlayers) {
      try {
        await addPlayerMutation.mutateAsync({
          name: player.name,
          position: player.position,
          school: player.school,
          grade: player.grade,
          tier: player.tier,
          notes: player.notes || '',
          order: player.order
        });
      } catch (error) {
        console.error(`Failed to add player ${player.name}:`, error);
      }
    }
    
    // Refresh the player list
    queryClient.invalidateQueries({ queryKey: ['/api/players'] });
    
    toast({
      title: "Success",
      description: `Loaded ${sleeperPlayers.length} rookies from Sleeper`,
    });
  };
  
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

  // Logic to determine which team is on the clock (linear draft)
  useEffect(() => {
    const pickInRound = pickCounter - (Math.ceil(pickCounter / teams.length) - 1) * teams.length;
    setSelectedTeamId(pickInRound);
  }, [pickCounter, teams.length]);

  // Draft a player
  const draftPlayer = (player: Player) => {
    setDraftHistory(prev => [
      ...prev,
      {
        id: pickCounter,
        player,
        teamId: selectedTeamId,
        pickNumber: pickCounter
      }
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
    
    setDraftHistory(prev => prev.slice(0, -1));
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

  // Trade picks between teams
  const openTradeDialog = (teamId: number) => {
    setFromTeamId(teamId);
    setToTeamId(null);
    setFromPickNumbers([]);
    setToPickNumbers([]);
    setIsTradeDialogOpen(true);
  };

  const togglePickSelection = (teamId: number, pickNumber: number) => {
    if (teamId === fromTeamId) {
      setFromPickNumbers(prev => 
        prev.includes(pickNumber) 
          ? prev.filter(p => p !== pickNumber) 
          : [...prev, pickNumber]
      );
    } else if (teamId === toTeamId) {
      setToPickNumbers(prev => 
        prev.includes(pickNumber) 
          ? prev.filter(p => p !== pickNumber) 
          : [...prev, pickNumber]
      );
    }
  };

  const executeTrade = () => {
    if (!fromTeamId || !toTeamId || fromPickNumbers.length === 0 || toPickNumbers.length === 0) {
      toast({
        title: "Invalid Trade",
        description: "You need to select picks from both teams to execute a trade",
        variant: "destructive",
      });
      return;
    }

    // Create a new map with existing traded picks
    const newTradedPicks = new Map(tradedPicks);
    
    // Add new traded picks from team 1 to team 2
    fromPickNumbers.forEach(pickNumber => {
      newTradedPicks.set(pickNumber, toTeamId!);
    });
    
    // Add new traded picks from team 2 to team 1
    toPickNumbers.forEach(pickNumber => {
      newTradedPicks.set(pickNumber, fromTeamId!);
    });
    
    // Update the traded picks state
    setTradedPicks(newTradedPicks);
    
    // Log the trade in a toast
    const fromTeam = teams.find(t => t.id === fromTeamId)?.name;
    const toTeam = teams.find(t => t.id === toTeamId)?.name;
    
    toast({
      title: "Trade Completed",
      description: `Trade between ${fromTeam} and ${toTeam} executed successfully`,
    });
    
    // Close the dialog and reset state
    setIsTradeDialogOpen(false);
    setFromTeamId(null);
    setToTeamId(null);
    setFromPickNumbers([]);
    setToPickNumbers([]);
  };

  // Get owned picks for a team
  const getTeamOwnedPicks = (teamId: number) => {
    const picks: { round: number; pick: number; status: string }[] = [];
    
    getDraftBoardData().forEach(round => {
      round.picks.forEach(pick => {
        const isPicked = draftHistory.some(draft => draft.pickNumber === pick.pick);
        
        // Skip if already drafted
        if (isPicked) return;
        
        // Check if original team and not permanently traded
        const isOriginallyOwned = pick.originalTeamId === teamId;
        const isActuallyOwned = pick.teamId === teamId;
        
        // Check if being traded in dialog
        const isBeingTradedAway = fromTeamId === teamId && fromPickNumbers.includes(pick.pick);
        const isBeingTradedFor = toTeamId === teamId && toPickNumbers.includes(pick.pick);
        
        // Original team's pick that they still own (or being considered for trade)
        if (isOriginallyOwned && isActuallyOwned) {
          picks.push({
            round: pick.round,
            pick: pick.pick,
            status: isBeingTradedAway ? 'traded-away' : 'owned'
          });
        }
        // Someone else's pick that this team acquired (or being considered to acquire)
        else if (!isOriginallyOwned && isActuallyOwned) {
          picks.push({
            round: pick.round,
            pick: pick.pick,
            status: isBeingTradedAway ? 'traded-away' : 'traded-for'
          });
        }
        // A pick being considered to acquire in current trade dialog
        else if (isBeingTradedFor) {
          picks.push({
            round: pick.round,
            pick: pick.pick,
            status: 'trading-for'
          });
        }
      });
    });
    
    return picks.sort((a, b) => a.pick - b.pick);
  };

  // Generate draft board data
  const getDraftBoardData = () => {
    const rounds = [];
    
    // Create a copy of the tradedPicks map for display in the trade dialog
    const displayTradedPicks = new Map(tradedPicks);
    
    // Add tentative trades to the display map if dialog is open
    if (isTradeDialogOpen && fromTeamId && toTeamId) {
      // Picks going from team 1 to team 2
      fromPickNumbers.forEach(pick => {
        displayTradedPicks.set(pick, toTeamId);
      });
      
      // Picks going from team 2 to team 1
      toPickNumbers.forEach(pick => {
        displayTradedPicks.set(pick, fromTeamId);
      });
    }
    
    for (let round = 1; round <= numberOfRounds; round++) {
      const picks = [];
      
      for (let i = 1; i <= teams.length; i++) {
        const teamIndex = i;
        const pickNumber = (round - 1) * teams.length + i;
        const team = teams.find(t => t.id === teamIndex);
        
        const draftPick = draftHistory.find(pick => pick.pickNumber === pickNumber);
        
        // Check if this pick has been traded (using actual trades for drafting, display trades for UI)
        const actualTeamId = tradedPicks.get(pickNumber) || teamIndex;
        const displayTeamId = displayTradedPicks.get(pickNumber) || teamIndex;
        
        const actualTeam = teams.find(t => t.id === displayTeamId);
        
        // For the current pick, use the actual team owner, not the display team
        const teamForDrafting = pickNumber === pickCounter ? actualTeamId : displayTeamId;
        
        picks.push({
          round,
          pick: pickNumber,
          originalTeamId: teamIndex,
          teamId: teamForDrafting,
          teamName: actualTeam ? actualTeam.name : `Team ${displayTeamId}`,
          originalTeamName: team ? team.name : `Team ${teamIndex}`,
          player: draftPick?.player || null,
          isActive: pickNumber === pickCounter,
          isTraded: displayTeamId !== teamIndex,
          isSelected: (fromTeamId === displayTeamId && fromPickNumbers.includes(pickNumber)) ||
                     (toTeamId === displayTeamId && toPickNumbers.includes(pickNumber))
        });
      }
      
      rounds.push({ round, picks });
    }
    
    return rounds;
  };

  // Handle errors
  if (playersQuery.isError || sleeperDataQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Draft Board</h2>
          <p className="text-gray-600">
            {playersQuery.isError 
              ? "An error occurred while loading the player data." 
              : "An error occurred while connecting to Sleeper API."}
            Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  // Handle Sleeper data loading
  const isLoadingSleeper = sleeperDataQuery.isLoading || leagueQuery.isLoading || usersQuery.isLoading;
  
  // Connection status message
  const connectionStatus = isLoadingSleeper 
    ? "Connecting to Sleeper..." 
    : sleeperDataQuery.isSuccess 
      ? `Connected to ${leagueQuery.data?.name || 'your Sleeper league'}`
      : "Using local draft data";

  const draftBoardData = getDraftBoardData();
  const currentRound = Math.ceil(pickCounter / teams.length);
  const currentRoundPicks = draftBoardData.find(r => r.round === currentRound)?.picks || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        onAddPlayer={() => setIsAddPlayerModalOpen(true)} 
        onExport={() => {}} 
        pageName="Live Draft Tracker"
      />
      
      {/* Draft Controls */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-primary/10 rounded-lg mb-4 p-4 flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-3 mb-2 md:mb-0">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">On the Clock:</span>
              <Badge className="font-bold px-4 py-1 bg-primary text-white">
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
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo Pick
            </Button>
            
            {/* Sleeper connection status */}
            <div className="flex items-center ml-2">
              <Badge variant="outline" className={`px-3 py-1 ${isLoadingSleeper ? 'bg-yellow-50 text-yellow-800' : sleeperDataQuery.isSuccess ? 'bg-green-50 text-green-800' : ''}`}>
                {isLoadingSleeper && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {connectionStatus}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-40 sm:w-60 text-sm"
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
            
            {/* Sleeper rookies integration button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSleeperRookies}
              disabled={isLoadingSleeper || !sleeperDataQuery.isSuccess}
              className="ml-2"
            >
              <Loader2 className={`h-3 w-3 mr-1 ${isLoadingSleeper ? 'animate-spin' : ''}`} />
              {isLoadingSleeper ? 'Loading...' : 'Load Sleeper Rookies'}
            </Button>
          </div>
        </div>
        
        {/* Full Draft Board */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Draft Board - All Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            {draftBoardData.map((round) => (
              <div key={round.round} className="mb-6">
                <h3 className="font-semibold text-sm mb-2 text-gray-700">Round {round.round}</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {round.picks.map((pick) => (
                    <div 
                      key={pick.pick} 
                      className={`border rounded-md p-2 text-center ${
                        pick.isActive ? 'border-primary-600 bg-primary-50 shadow-sm' : 
                        pick.player ? 'bg-gray-100' : 'bg-white'
                      } ${pick.isTraded ? 'border-orange-400' : ''}`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {pick.pick} - {pick.teamName}
                        {pick.isTraded && (
                          <span className="text-orange-500 text-[10px] ml-1">(traded)</span>
                        )}
                      </div>
                      {pick.player ? (
                        <div>
                          <div className="flex items-center">
                            <span className={`inline-block w-6 text-center text-xs font-semibold rounded position-${pick.player.position} mr-1`}>
                              {pick.player.position}
                            </span>
                            <span className="text-xs font-medium truncate" title={pick.player.name}>
                              {pick.player.name}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-500 mt-0.5 truncate" title={pick.player.school}>
                            {pick.player.school}
                          </div>
                        </div>
                      ) : (
                        <div className="h-8 flex items-center justify-center text-xs text-gray-400">
                          {pick.isActive ? 'On the clock' : 'Empty'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Rosters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Team Rosters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map((team) => (
                <div key={team.id} className={`border rounded-md overflow-hidden ${
                  team.id === selectedTeamId ? 'border-primary border-2 shadow-md' : 'border'
                }`}>
                  <div className={`flex flex-col p-2 ${
                    team.id === selectedTeamId ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    <div 
                      className="font-medium text-sm flex items-center cursor-pointer w-full"
                      onClick={() => startEditingTeam(team.id)}
                    >
                      {teamEditing === team.id ? (
                        <Input
                          value={teamNameInput}
                          onChange={(e) => setTeamNameInput(e.target.value)}
                          className="text-sm h-7 bg-white"
                          autoFocus
                          onBlur={saveTeamName}
                          onKeyDown={(e) => e.key === 'Enter' && saveTeamName()}
                        />
                      ) : (
                        <div className="flex items-center">
                          {team.avatar && (
                            <div className="w-5 h-5 rounded-full bg-gray-200 mr-1 overflow-hidden">
                              <img 
                                src={`https://sleepercdn.com/avatars/thumbs/${team.avatar}`} 
                                alt={team.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            </div>
                          )}
                          <span className="truncate">{team.name}</span>
                          <Edit className="h-3 w-3 ml-1 opacity-60" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openTradeDialog(team.id)}
                        className={`h-6 px-2 py-0 text-xs ${team.id === selectedTeamId ? 'text-white hover:bg-primary-700' : 'text-primary'}`}
                      >
                        <ArrowLeftRight className="h-3 w-3 mr-1" />
                        Trade Picks
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 text-xs space-y-1 h-40 overflow-y-auto">
                    {getTeamPlayers(team.id).length === 0 ? (
                      <div className="text-gray-400 text-center pt-2">No picks yet</div>
                    ) : (
                      getTeamPlayers(team.id).map((pick) => (
                        <div key={pick.id} className="flex items-center py-1 border-b border-gray-100 last:border-0">
                          <span className={`inline-block w-6 text-center mr-1 text-xs font-semibold rounded position-${pick.player.position}`}>
                            {pick.player.position}
                          </span>
                          <div className="flex flex-col">
                            <span className="truncate text-xs font-medium" title={pick.player.name}>{pick.player.name}</span>
                            <span className="text-[9px] text-gray-500" title={pick.player.school}>{pick.player.school}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Players */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Available Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[calc(100vh-560px)]">
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
          </CardContent>
        </Card>
      </div>
      
      <AddPlayerModal 
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onAddPlayer={addPlayerMutation.mutateAsync}
        isSubmitting={addPlayerMutation.isPending}
      />

      {/* Trade Picks Dialog */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Trade Draft Picks</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            {/* From Team */}
            <div>
              <div className="mb-2">
                <p className="text-sm font-medium">From Team:</p>
                <Select 
                  value={fromTeamId?.toString() || ''}
                  onValueChange={(value) => setFromTeamId(parseInt(value))}
                  disabled={fromTeamId !== null}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {fromTeamId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Select picks to trade away:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                    {getTeamOwnedPicks(fromTeamId).map((pick) => (
                      <div 
                        key={pick.pick} 
                        onClick={() => togglePickSelection(fromTeamId, pick.pick)}
                        className={`text-xs p-1 rounded cursor-pointer ${
                          fromPickNumbers.includes(pick.pick) 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Round {pick.round}, Pick {pick.pick}
                      </div>
                    ))}
                    {getTeamOwnedPicks(fromTeamId).length === 0 && (
                      <p className="text-xs text-gray-400 p-1">No available picks</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* To Team */}
            <div>
              <div className="mb-2">
                <p className="text-sm font-medium">To Team:</p>
                <Select 
                  value={toTeamId?.toString() || ''}
                  onValueChange={(value) => setToTeamId(parseInt(value))}
                  disabled={!fromTeamId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => team.id !== fromTeamId)
                      .map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              {toTeamId && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Select picks to receive:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                    {getTeamOwnedPicks(toTeamId).map((pick) => (
                      <div 
                        key={pick.pick} 
                        onClick={() => togglePickSelection(toTeamId, pick.pick)}
                        className={`text-xs p-1 rounded cursor-pointer ${
                          toPickNumbers.includes(pick.pick) 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        Round {pick.round}, Pick {pick.pick}
                      </div>
                    ))}
                    {getTeamOwnedPicks(toTeamId).length === 0 && (
                      <p className="text-xs text-gray-400 p-1">No available picks</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium mb-2">Trade Summary:</p>
            <div className="text-sm">
              {fromTeamId && toTeamId ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">
                      {teams.find(t => t.id === fromTeamId)?.name} sends:
                    </p>
                    {fromPickNumbers.length > 0 ? (
                      <ul className="list-disc pl-5 text-xs space-y-1">
                        {fromPickNumbers.map(pick => {
                          const roundInfo = getDraftBoardData().flatMap(r => r.picks).find(p => p.pick === pick);
                          return (
                            <li key={pick}>
                              Round {roundInfo?.round}, Pick {pick}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400">No picks selected</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {teams.find(t => t.id === toTeamId)?.name} sends:
                    </p>
                    {toPickNumbers.length > 0 ? (
                      <ul className="list-disc pl-5 text-xs space-y-1">
                        {toPickNumbers.map(pick => {
                          const roundInfo = getDraftBoardData().flatMap(r => r.picks).find(p => p.pick === pick);
                          return (
                            <li key={pick}>
                              Round {roundInfo?.round}, Pick {pick}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400">No picks selected</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Select both teams to create a trade</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={executeTrade} 
              disabled={!fromTeamId || !toTeamId || fromPickNumbers.length === 0 || toPickNumbers.length === 0}
            >
              Execute Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}