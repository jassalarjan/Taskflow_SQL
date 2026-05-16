import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Palette, ChevronDown } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, colorScheme, toggleTheme, setThemeMode, setColorSchemeMode, themes, colorSchemes } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'auto':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  const getThemeName = () => {
    return themes[theme]?.name || 'Light';
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Theme Toggle Button */}
      <div className="relative">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Change theme"
        >
          {getThemeIcon()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getThemeName()}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {showThemeMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowThemeMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
              <div className="py-1">
                {Object.entries(themes).map(([key, themeData]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setThemeMode(key);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      theme === key ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {key === 'light' && <Sun className="w-4 h-4" />}
                    {key === 'dark' && <Moon className="w-4 h-4" />}
                    {key === 'auto' && <Monitor className="w-4 h-4" />}
                    <span>{themeData.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Color Scheme Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowColorMenu(!showColorMenu)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Change color scheme"
        >
          <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div
            className={`w-4 h-4 rounded-full ${
              colorSchemes[colorScheme]?.primary || 'bg-blue-500'
            }`}
          />
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {showColorMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowColorMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
              <div className="py-1">
                {Object.entries(colorSchemes).map(([key, schemeData]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setColorSchemeMode(key);
                      setShowColorMenu(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      colorScheme === key ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${schemeData.primary}`} />
                    <span>{schemeData.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Theme Toggle (Sun/Moon button) */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Toggle theme"
      >
        {getThemeIcon()}
      </button>
    </div>
  );
};

export default ThemeToggle;