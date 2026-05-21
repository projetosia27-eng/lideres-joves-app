import {ChangeDetectionStrategy, Component, signal, inject, OnInit} from '@angular/core';
import {RouterOutlet, RouterLink, RouterLinkActive, Router} from '@angular/router';
import { ThemeService } from './theme.service';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30">
      
      @if (isAuthenticated()) {
        <!-- Sidebar container for desktop to maintain spacing -->
        <div class="hidden lg:block w-72 shrink-0 p-4"></div>

        <!-- Sidebar (Desktop Only) -->
        <aside class="hidden lg:flex fixed inset-y-4 left-4 z-30 w-64 glass-panel rounded-3xl border-r border-slate-200 dark:border-white/5 flex-col flex">
          
          <!-- Logo Area -->
          <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-white/5 shrink-0 mt-2 lg:mt-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white p-1 shadow-lg shadow-indigo-500/20">
              <span class="material-symbols-outlined text-[24px]">local_fire_department</span>
            </div>
            <span class="font-display font-black text-2xl tracking-tighter text-slate-800 dark:text-white uppercase">Lidera<span class="text-indigo-600 dark:text-indigo-400">Jovem</span></span>
          </div>

          <!-- Navigation Links -->
          <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            <a routerLink="/dashboard" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" [routerLinkActiveOptions]="{exact: true}" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">dashboard</span>
              Dashboard
            </a>

            <a routerLink="/jovens" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">groups</span>
              Jovens
            </a>

            <a routerLink="/presencas" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">fact_check</span>
              Presenças
            </a>

            <a routerLink="/eventos" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">event</span>
              Eventos
            </a>

            <a routerLink="/diretoria" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">badge</span>
              Diretoria
            </a>

            <a routerLink="/materiais" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">menu_book</span>
              Estudos
            </a>

            <a routerLink="/financeiro" routerLinkActive="bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-white">payments</span>
              Financeiro
            </a>
          </nav>

          <!-- Bottom Actions -->
          <div class="p-4 border-t border-slate-100 dark:border-white/5 shrink-0 space-y-2">
            <button (click)="themeService.toggleTheme()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-hover:text-amber-500 dark:group-hover:text-amber-400">
                {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
              </span>
              <span class="text-left font-medium">Modo {{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
            </button>
            
            <a routerLink="/configuracoes" routerLinkActive="bg-slate-100 dark:bg-white/5 font-semibold" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group">
              <span class="material-symbols-outlined text-[20px] group-[.active]:text-indigo-600 dark:group-[.active]:text-indigo-400">settings</span>
              Configurações
            </a>
            
            <div class="mt-2 flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-fuchsia-100 dark:from-indigo-900/50 dark:to-fuchsia-900/50 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 shrink-0 border border-white/50 dark:border-white/10 shadow-sm">
                {{ getUserInitials() }}
              </div>
              <div class="flex-1 min-w-0 flex flex-col">
                <span class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ userEmail() }}</span>
                <button (click)="logout()" class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-left hover:text-rose-500 transition-colors">Sair da Conta</button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col min-w-0 h-full relative lg:pt-4 lg:pr-4 lg:pb-4 z-10">
          <!-- Mobile Header Placeholder (only visible on mobile) -->
          <header class="h-16 flex items-center justify-between px-4 sm:px-8 glass-panel z-10 shadow-sm shrink-0 lg:hidden border-b border-slate-200 dark:border-white/5">
             <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white p-1">
                <span class="material-symbols-outlined text-[20px]">local_fire_department</span>
              </div>
              <span class="font-display font-black text-xl text-slate-800 dark:text-white tracking-tighter uppercase">Lidera<span class="text-indigo-600 dark:text-indigo-400">Jovem</span></span>
            </div>
            
            <div class="flex items-center gap-1 -mr-2">
              <button (click)="themeService.toggleTheme()" class="flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                <span class="material-symbols-outlined text-[20px]">
                  {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
                </span>
                <span class="text-[10px] font-black uppercase tracking-tight hidden xs:inline">{{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
              </button>
              <a routerLink="/configuracoes" class="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                <span class="material-symbols-outlined text-[20px]">settings</span>
              </a>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto lg:rounded-3xl lg:border lg:border-slate-200 lg:dark:border-white/5 bg-white/50 dark:bg-[#060608]/80 backdrop-blur-3xl shadow-2xl relative p-4 pb-24 sm:p-8 sm:pb-24 lg:p-8 lg:pb-8">
            <router-outlet></router-outlet>
          </div>
          
          <!-- Bottom Navigation (Mobile Only) -->
          <nav class="lg:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200 dark:border-white/5 z-40 pb-2 bg-white/90 dark:bg-[#060608]/90">
            <div class="grid grid-cols-5 items-center px-1 py-1 gap-1">
              <a routerLink="/dashboard" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center gap-1 p-2 text-slate-400 dark:text-slate-500 transition-colors w-full [&.active-nav]:text-indigo-600 [&.active-nav]:dark:text-indigo-400">
                <span class="material-symbols-outlined text-[22px]">dashboard</span>
                <span class="text-[9px] font-black uppercase tracking-wider">Início</span>
              </a>
              <a routerLink="/jovens" routerLinkActive="active-nav" class="flex flex-col items-center justify-center gap-1 p-2 text-slate-400 dark:text-slate-500 transition-colors w-full [&.active-nav]:text-indigo-600 [&.active-nav]:dark:text-indigo-400">
                <span class="material-symbols-outlined text-[22px]">groups</span>
                <span class="text-[9px] font-black uppercase tracking-wider">Jovens</span>
              </a>
              <a routerLink="/presencas" routerLinkActive="active-nav" class="flex flex-col items-center justify-center gap-1 p-2 text-slate-400 dark:text-slate-500 transition-colors w-full [&.active-nav]:text-indigo-600 [&.active-nav]:dark:text-indigo-400">
                <span class="material-symbols-outlined text-[22px]">fact_check</span>
                <span class="text-[9px] font-black uppercase tracking-wider">Chamada</span>
              </a>
              <a routerLink="/eventos" routerLinkActive="active-nav" class="flex flex-col items-center justify-center gap-1 p-2 text-slate-400 dark:text-slate-500 transition-colors w-full [&.active-nav]:text-indigo-600 [&.active-nav]:dark:text-indigo-400">
                 <span class="material-symbols-outlined text-[22px]">event</span>
                 <span class="text-[9px] font-black uppercase tracking-wider">Eventos</span>
              </a>
              <button (click)="toggleMobileMenu()" [class.text-indigo-600]="isMobileMenuOpen()" [class.dark:text-indigo-400]="isMobileMenuOpen()" class="flex flex-col items-center justify-center gap-1 p-2 text-slate-400 dark:text-slate-500 transition-colors w-full outline-none">
                 <span class="material-symbols-outlined text-[22px]">menu</span>
                 <span class="text-[9px] font-black uppercase tracking-wider">Mais</span>
              </button>
            </div>
          </nav>

          <!-- Mobile "Mais" Menu Overlay (Bottom Sheet) -->
          @if (isMobileMenuOpen()) {
            <div class="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
              <!-- Backdrop -->
              <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeMobileMenu()" (keyup.escape)="closeMobileMenu()" tabindex="0" role="button" aria-label="Fechar menu"></div>
              
              <!-- Content -->
              <div class="relative bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-2xl pt-3 pb-8 flex flex-col border-t border-slate-200 dark:border-slate-800">
                <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
                <div class="px-6 space-y-1">
                  <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Mais Opções</h3>
                  
                  <a routerLink="/diretoria" (click)="closeMobileMenu()" routerLinkActive="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" class="flex items-center gap-4 p-3 rounded-2xl text-slate-700 dark:text-slate-300 active:bg-slate-50 dark:active:bg-slate-800 transition-all font-bold">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <span class="material-symbols-outlined">badge</span>
                    </div>
                    Diretoria
                  </a>
                  
                  <a routerLink="/materiais" (click)="closeMobileMenu()" routerLinkActive="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" class="flex items-center gap-4 p-3 rounded-2xl text-slate-700 dark:text-slate-300 active:bg-slate-50 dark:active:bg-slate-800 transition-all font-bold">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <span class="material-symbols-outlined">menu_book</span>
                    </div>
                    Estudos e Materiais
                  </a>
                  
                  <a routerLink="/financeiro" (click)="closeMobileMenu()" routerLinkActive="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400" class="flex items-center gap-4 p-3 rounded-2xl text-slate-700 dark:text-slate-300 active:bg-slate-50 dark:active:bg-slate-800 transition-all font-bold">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <span class="material-symbols-outlined">payments</span>
                    </div>
                    Controle Financeiro
                  </a>
                </div>
              </div>
            </div>
          }
        </main>
      } @else {
        <main class="flex-1 h-screen overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      }
    </div>
  `
})
export class App implements OnInit {
  themeService = inject(ThemeService);
  router = inject(Router);
  isMobileMenuOpen = signal(false);
  isAuthenticated = signal(false);
  userEmail = signal('');

  ngOnInit() {
    auth.onAuthStateChanged(user => {
      this.isAuthenticated.set(!!user);
      if (user?.email) {
        this.userEmail.set(user.email);
      } else {
        this.userEmail.set('');
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  async logout() {
    await signOut(auth);
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const email = this.userEmail();
    if (!email) return 'User';
    return email.substring(0, 2).toUpperCase();
  }
}

