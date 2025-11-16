import { Button } from '@/components/ui/button';

interface FilterOption {
  label: string;
  value: string;
}

interface TableFiltersProps {
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export function TableFilters({ options, activeFilter, onFilterChange }: TableFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={activeFilter === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className="text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
