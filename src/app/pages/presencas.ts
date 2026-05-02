import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { DataService, Evento } from '../data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-presencas',
  standalone: true,
  imports: [DatePipe, FormsModule, NgClass],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 flex flex-col h-full">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
          <span class="material-symbols-outlined text-[32px] text-indigo-500 drop-shadow-sm">how_to_reg</span>
          Presenças
        </h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <!-- Lista de Eventos (Sidebar) -->
        <div class="card-premium flex flex-col overflow-hidden h-[calc(100vh-140px)] p-0">
          <div class="p-5 border-b border-indigo-100 dark:border-white/5 bg-indigo-50/50 dark:bg-indigo-500/5 backdrop-blur-md">
            <h2 class="text-sm font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">Selecione o Evento</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 bg-white/50 dark:bg-[#0a0a0c]/50">
            @for (evento of data.eventos(); track evento.id) {
              <button 
                class="w-full text-left p-5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex items-start gap-4 group"
                [ngClass]="selectedEventoId() === evento.id ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-l-4 border-indigo-500 dark:border-indigo-400' : 'border-l-4 border-transparent'"
                (click)="selectEvento(evento)">
                
                <div class="flex-shrink-0 mt-1">
                  <span class="material-symbols-outlined text-[20px]" [ngClass]="selectedEventoId() === evento.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-400'">
                    event
                  </span>
                </div>
                
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 dark:text-white truncate text-base" [ngClass]="selectedEventoId() === evento.id ? 'text-indigo-700 dark:text-indigo-300' : ''">{{ evento.nome }}</p>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1" [ngClass]="selectedEventoId() === evento.id ? 'text-indigo-500 dark:text-indigo-400' : ''">{{ evento.data | date:'dd/MM/yyyy' }}</p>
                </div>
                
                @if (evento.realizado) {
                  <span class="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Lista de Checkbox (Main Content) -->
        <div class="md:col-span-2 card-premium flex flex-col overflow-hidden h-[calc(100vh-140px)] p-0">
          @if (selectedEvento()) {
            <div class="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-md">
              <div>
                <h2 class="text-2xl font-display font-bold text-slate-800 dark:text-white">{{ selectedEvento()?.nome }}</h2>
                <p class="text-[11px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mt-1">{{ selectedEvento()?.data | date:'dd/MM/yyyy' }}</p>
              </div>
              
              <button (click)="salvarPresencas()" class="btn-premium px-6 py-2.5 !rounded-xl text-xs flex items-center justify-center gap-2 w-full sm:w-auto">
                <span class="material-symbols-outlined text-[18px]">save</span>
                Salvar Lista
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-[#0a0a0c]/30">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (jovem of data.jovens(); track jovem.id) {
                  <label class="flex items-center p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-indigo-500/10 cursor-pointer transition-all shadow-sm bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-sm has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-500/20 has-[:checked]:border-indigo-400 dark:has-[:checked]:border-indigo-500 group">
                    <input type="checkbox" 
                           [ngModel]="presencasState()[jovem.id]" 
                           (ngModelChange)="togglePresenca(jovem.id, $event)"
                           class="w-5 h-5 rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 mr-4 transition-all">
                    <div class="flex items-center gap-4 w-full">
                      <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center uppercase text-slate-700 dark:text-slate-200 font-black text-sm border border-slate-200/50 dark:border-white/10 shadow-sm group-has-[:checked]:from-indigo-100 group-has-[:checked]:to-white dark:group-has-[:checked]:from-indigo-500/40 dark:group-has-[:checked]:to-slate-800 group-has-[:checked]:text-indigo-700 dark:group-has-[:checked]:text-indigo-300 transition-all">
                        {{ getInitials(jovem.nome) }}
                      </div>
                      <span class="font-bold text-slate-700 dark:text-slate-200 text-sm flex-1 group-has-[:checked]:text-indigo-900 dark:group-has-[:checked]:text-white transition-colors">{{ jovem.nome }}</span>
                    </div>
                  </label>
                }
              </div>
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center bg-slate-50/50 dark:bg-[#0a0a0c]/30 border-2 border-dashed border-slate-200 dark:border-white/10 m-6 rounded-2xl">
              <span class="material-symbols-outlined text-[64px] mb-4 text-slate-300 dark:text-slate-600 drop-shadow-md">list_alt</span>
              <p class="font-display font-bold text-xl text-slate-800 dark:text-white uppercase tracking-wider mb-2">Nenhum evento selecionado</p>
              <p class="text-sm font-medium">Selecione um evento na lista ao lado para realizar a chamada.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class PresencasComponent {
  data = inject(DataService);
  
  selectedEventoId = signal<string | null>(null);
  selectedEvento = computed(() => this.data.eventos().find(e => e.id === this.selectedEventoId()));
  
  presencasState = signal<Record<string, boolean>>({});

  selectEvento(evento: Evento) {
    this.selectedEventoId.set(evento.id);
    
    // Load existing presences
    const newState: Record<string, boolean> = {};
    for (const j of this.data.jovens()) {
      const hist = j.historicoPresenca.find(h => h.eventoId === evento.id);
      newState[j.id] = hist ? hist.presente : false;
    }
    this.presencasState.set(newState);
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  togglePresenca(jovemId: string, value: boolean) {
    this.presencasState.update(state => ({ ...state, [jovemId]: value }));
  }

  salvarPresencas() {
    const evId = this.selectedEventoId();
    if (evId) {
      this.data.registrarPresenca(evId, this.presencasState());
      alert('Presenças atualizadas com sucesso!');
    }
  }
}
