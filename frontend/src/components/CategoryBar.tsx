import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Armchair, Lamp, Coffee, Watch, Laptop, Palette } from 'lucide-react';

interface CategoryBarProps {
  categories: string[];
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ categories }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  const getIcon = (cat: string) => {
    const l = cat.toLowerCase();
    if (l.includes('furn')) return <Armchair className="w-4 h-4" />;
    if (l.includes('light') || l.includes('lamp')) return <Lamp className="w-4 h-4" />;
    if (l.includes('ceram') || l.includes('cup') || l.includes('kit')) return <Coffee className="w-4 h-4" />;
    if (l.includes('acc') || l.includes('watch')) return <Watch className="w-4 h-4" />;
    if (l.includes('elec') || l.includes('desk')) return <Laptop className="w-4 h-4" />;
    return <Palette className="w-4 h-4" />;
  };

  const handleSelect = (cat: string) => {
    if (activeCategory === cat) {
      navigate('/catalog');
    } else {
      navigate(`/catalog?category=${encodeURIComponent(cat)}`);
    }
  };

  return (
    <div className="py-6 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-2.5 min-w-max pb-1">
        <button
          onClick={() => navigate('/catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            !activeCategory
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
              : 'bg-surface-100 dark:bg-surface-200 text-muted-foreground hover:text-foreground border border-border/80'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Works</span>
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => handleSelect(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                  : 'bg-surface-100 dark:bg-surface-200 text-muted-foreground hover:text-foreground border border-border/80'
              }`}
            >
              {getIcon(cat)}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
