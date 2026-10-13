import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  const saved = (localStorage.getItem('passu_theme') || localStorage.getItem('cartly_theme')) as Theme;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark'; // Editorial dark mode default
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  if (typeof document !== 'undefined') {
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    theme: initial,
    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('passu_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: next });
    },
    setTheme: (theme: Theme) => {
      localStorage.setItem('passu_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme });
    },
  };
});
