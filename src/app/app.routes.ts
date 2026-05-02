import {Routes} from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.Login) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'jovens', loadComponent: () => import('./pages/jovens').then(m => m.JovensComponent), canActivate: [authGuard] },
  { path: 'jovens/:id', loadComponent: () => import('./pages/detalhe-jovem').then(m => m.DetalheJovemComponent), canActivate: [authGuard] },
  { path: 'presencas', loadComponent: () => import('./pages/presencas').then(m => m.PresencasComponent), canActivate: [authGuard] },
  { path: 'eventos', loadComponent: () => import('./pages/eventos').then(m => m.EventosComponent), canActivate: [authGuard] },
  { path: 'materiais', loadComponent: () => import('./pages/materiais').then(m => m.MateriaisComponent), canActivate: [authGuard] },
  { path: 'financeiro', loadComponent: () => import('./pages/financeiro').then(m => m.FinanceiroComponent), canActivate: [authGuard] },
  { path: 'configuracoes', loadComponent: () => import('./pages/configuracoes').then(m => m.ConfiguracoesComponent), canActivate: [authGuard] }
];
