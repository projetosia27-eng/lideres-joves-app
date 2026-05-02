import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('light');
  isDark = signal<boolean>(false);

  constructor() {
    const savedTheme = localStorage.getItem('theme') as Theme || 'light';
    this.theme.set(savedTheme);
    
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem('theme', currentTheme);
      this.applyTheme(currentTheme);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.theme() === 'system') {
        this.isDark.set(e.matches);
        this.updateDOMClass(e.matches);
      }
    });
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
  }

  toggleTheme() {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }

  private applyTheme(theme: Theme) {
    let isDarkMode = false;
    if (theme === 'system') {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDarkMode = theme === 'dark';
    }
    
    this.isDark.set(isDarkMode);
    this.updateDOMClass(isDarkMode);
  }

  private updateDOMClass(isDarkMode: boolean) {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
