import { BarChart3, Download, ListChecks, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';

interface HeaderProps {
  onAddPlayer: () => void;
  onExport: () => void;
  pageName?: string;
}

export default function Header({ onAddPlayer, onExport, pageName }: HeaderProps) {
  const [location] = useLocation();
  const isLiveDraft = location === '/live-draft';
  
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <BarChart3 className="h-8 w-8 mr-2" />
          <h1 className="text-xl font-bold">{pageName || "Dynasty Draft Board"}</h1>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex justify-center space-x-2">
            <Link href="/">
              <Button 
                variant={location === '/' ? "secondary" : "outline"} 
                size="sm" 
                className={location === '/' ? "bg-secondary text-white" : "bg-primary/80 text-white hover:bg-primary/60"}
              >
                <ListChecks className="h-5 w-5 mr-1" />
                Player Rankings
              </Button>
            </Link>
            <Link href="/live-draft">
              <Button 
                variant={isLiveDraft ? "secondary" : "outline"} 
                size="sm" 
                className={isLiveDraft ? "bg-secondary text-white" : "bg-primary/80 text-white hover:bg-primary/60"}
              >
                <PlayCircle className="h-5 w-5 mr-1" />
                Live Draft
              </Button>
            </Link>
          </div>
          <div className="flex justify-center space-x-2">
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
            {!isLiveDraft && (
              <Button
                onClick={onExport}
                className="bg-accent hover:bg-amber-600"
                size="sm"
              >
                <Download className="h-5 w-5 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
