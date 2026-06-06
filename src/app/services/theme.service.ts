import { Injectable } from '@angular/core';

export type Theme = 'cyberpunk' | 'dark' | 'light' | 'minimal';

const THEME_KEY = 'app_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private current: Theme = 'cyberpunk';

  init() {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    this.apply(saved || 'cyberpunk');
  }

  get currentTheme(): Theme {
    return this.current;
  }

  apply(theme: Theme) {
    this.current = theme;
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Status bar (Android PWA) boja prati temu da se header uklapa do vrha
    const topColors: Record<Theme, string> = {
      cyberpunk: '#00111a',
      minimal: '#0a0a0a',
      dark: '#0f0f1a',
      light: '#f5f3ff'
    };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', topColors[theme] || '#00111a');
  }
}
