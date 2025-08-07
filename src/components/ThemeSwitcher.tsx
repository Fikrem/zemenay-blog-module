'use client';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  console.log('Current theme:', theme, 'Resolved theme:', resolvedTheme);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme:</span>
      <select
        value={theme}
        onChange={(e) => {
          console.log('Changing theme to:', e.target.value);
          setTheme(e.target.value as 'light' | 'dark' | 'system');
        }}
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <span className="text-xs text-gray-500">({resolvedTheme})</span>
    </div>
  );
}