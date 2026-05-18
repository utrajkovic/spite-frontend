import { Injectable } from '@angular/core';

export type Theme = 'cyberpunk' | 'dark' | 'light';

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
  }
}
