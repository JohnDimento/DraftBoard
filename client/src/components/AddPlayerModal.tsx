import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayerFormData, POSITIONS, TIERS, DEFAULT_PLAYER } from '@/lib/draftBoardTypes';
import { useToast } from '@/hooks/use-toast';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (player: Omit<PlayerFormData & { order: number }, 'id'>) => Promise<any>;
  isSubmitting: boolean;
}

export default function AddPlayerModal({ 
  isOpen, 
  onClose, 
  onAddPlayer,
  isSubmitting 
}: AddPlayerModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PlayerFormData>({ ...DEFAULT_PLAYER });
  
  const resetForm = () => {
    setFormData({ ...DEFAULT_PLAYER });
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === '' ? 0 : parseInt(value);
    
    setFormData((prev) => ({
      ...prev,
      [name]: numberValue,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'tier' ? parseInt(value) : value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Missing Name",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.position) {
      toast({
        title: "Missing Position",
        description: "Player position is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Add order = 0 to place at the end of the list (the server will handle proper ordering)
      await onAddPlayer({ ...formData, order: 0 });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">Add New Player</DialogTitle>
          <Button 
            variant="ghost" 
            className="absolute top-2 right-2 h-8 w-8 p-0" 
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Player Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter player name"
              className="mt-1"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                Position
              </Label>
              <Select 
                name="position" 
                value={formData.position} 
                onValueChange={(value) => handleSelectChange('position', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="school" className="text-sm font-medium text-gray-700">
                School
              </Label>
              <Input
                id="school"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                placeholder="Enter school"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                Grade (0-100)
              </Label>
              <Input
                id="grade"
                name="grade"
                type="number"
                min="0"
                max="100"
                value={formData.grade}
                onChange={handleNumberChange}
                placeholder="Enter grade"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="tier" className="text-sm font-medium text-gray-700">
                Tier
              </Label>
              <Select 
                name="tier" 
                value={formData.tier.toString()} 
                onValueChange={(value) => handleSelectChange('tier', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id.toString()}>
                      {tier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter player notes"
              className="mt-1 h-24"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-secondary hover:bg-blue-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
