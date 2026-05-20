import {Routes} from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'jovens', loadComponent: () => import('./pages/jovens/jovens').then(m => m.JovensComponent), canActivate: [authGuard] },
  { path: 'jovens/:id', loadComponent: () => import('./pages/detalhe-jovem/detalhe-jovem').then(m => m.DetalheJovemComponent), canActivate: [authGuard] },
  { path: 'presencas', loadComponent: () => import('./pages/presencas/presencas').then(m => m.PresencasComponent), canActivate: [authGuard] },
  { path: 'eventos', loadComponent: () => import('./pages/eventos/eventos').then(m => m.EventosComponent), canActivate: [authGuard] },
  { path: 'materiais', loadComponent: () => import('./pages/materiais/materiais').then(m => m.MateriaisComponent), canActivate: [authGuard] },
  { path: 'financeiro', loadComponent: () => import('./pages/financeiro/financeiro').then(m => m.FinanceiroComponent), canActivate: [authGuard] },
  { path: 'configuracoes', loadComponent: () => import('./pages/configuracoes/configuracoes').then(m => m.ConfiguracoesComponent), canActivate: [authGuard] }
];
