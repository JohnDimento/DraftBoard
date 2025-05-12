import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddPlayer: () => void;
  onExport: () => void;
}

export default function Header({ onAddPlayer, onExport }: HeaderProps) {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <BarChart3 className="h-8 w-8 mr-2" />
          <h1 className="text-xl font-bold">Dynasty Draft Board</h1>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={onAddPlayer}
            className="bg-secondary hover:bg-blue-600"
            size="sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Player
          </Button>
          <Button
            onClick={onExport}
            className="bg-accent hover:bg-amber-600"
            size="sm"
          >
            <Download className="h-5 w-5 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </header>
  );
}
