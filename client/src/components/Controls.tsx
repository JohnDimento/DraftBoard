import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterOptions, SortOption, POSITIONS, TIERS } from '@/lib/draftBoardTypes';

interface ControlsProps {
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
}

export default function Controls({
  filterOptions,
  setFilterOptions,
  sortOption,
  setSortOption,
}: ControlsProps) {
  const [searchValue, setSearchValue] = useState(filterOptions.search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterOptions({ ...filterOptions, search: searchValue });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSortChange = (value: string) => {
    setSortOption({ ...sortOption, field: value as SortOption['field'] });
  };

  const handlePositionChange = (value: string) => {
    setFilterOptions({ ...filterOptions, position: value });
  };

  const handleTierChange = (value: string) => {
    setFilterOptions({ ...filterOptions, tier: value });
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
        <div className="flex flex-col sm:flex-row items-center mb-3 md:mb-0">
          <div className="flex items-center mr-4 mb-2 sm:mb-0">
            <span className="text-sm font-medium mr-2">Sort by:</span>
            <Select value={sortOption.field} onValueChange={handleSortChange}>
              <SelectTrigger className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="position">Position</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
                <SelectItem value="tier">Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Filter:</span>
            <Select value={filterOptions.position} onValueChange={handlePositionChange}>
              <SelectTrigger className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[140px] mr-2">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOptions.tier} onValueChange={handleTierChange}>
              <SelectTrigger className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1.5 text-sm w-[120px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {TIERS.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id.toString()}>
                    {tier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-gray-100 border border-gray-300 text-gray-800 text-sm rounded-md focus:ring-secondary focus:border-secondary block w-full pl-10 py-1.5"
            placeholder="Search players..."
          />
        </div>
      </div>
    </div>
  );
}
