import { createContext, useContext, useState, useEffect } from 'react';

// All available themes
const THEMES = ['cherry', 'blue', 'dark', 'night'];
const DEFAULT_LIGHT = 'cherry';
const DEFAULT_DARK = 'night';

// Workspace Theme Context (persistent)
const WorkspaceThemeContext = createContext();

export const WorkspaceThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const saved = localStorage.getItem('workspace-theme');
    if (saved && THEMES.includes(saved)) return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? DEFAULT_DARK : DEFAULT_LIGHT;
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.body.classList.remove(...THEMES.map(t => `${t}-theme`));
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('workspace-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' || prev === 'night') ? DEFAULT_LIGHT : DEFAULT_DARK);
  };

  return (
    <WorkspaceThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </WorkspaceThemeContext.Provider>
  );
};

export const useWorkspaceTheme = () => {
  const context = useContext(WorkspaceThemeContext);
  if (context === undefined) {
    throw new Error('useWorkspaceTheme must be used within a WorkspaceThemeProvider');
  }
  return context;
};