import { Component, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, StatusScore } from '../data.service';

@Component({
  selector: 'app-detalhe-jovem',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule],
  template: `
    @if (jovem()) {
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header / Back button -->
        <div class="flex items-center gap-4">
          <a routerLink="/jovens" class="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors tooltip-trigger" title="Voltar para lista">
            <span class="material-symbols-outlined text-[20px] block">arrow_back</span>
          </a>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Detalhes do Jovem</h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Card Perfil Principal -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:col-span-1 flex flex-col items-center text-center space-y-4">
            <div class="w-24 h-24 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-inner ring-1 ring-slate-100 dark:ring-slate-700">
              @if(jovem()?.fotoUrl) {
                <img [src]="jovem()?.fotoUrl" [alt]="jovem()?.nome" referrerpolicy="no-referrer" class="w-full h-full object-cover">
              } @else {
                <span class="uppercase text-slate-700 dark:text-slate-200 font-bold text-3xl">{{ getInitials(jovem()?.nome || '') }}</span>
              }
            </div>
            
            <div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ jovem()?.nome }}</h2>
              <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">{{ jovem()?.idade }} anos</p>
            </div>
            
            <div class="w-full py-4 border-t border-b border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
              <span class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Atual</span>
              <span class="px-3 py-1.5 text-[10px] uppercase font-bold rounded-full border inline-block whitespace-nowrap"
                    [class]="getBadgeClass(jovem()?.score || 'verde')">
                {{ jovem()?.score }}
              </span>
            </div>
            
            <div class="w-full space-y-3 text-left p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">call</span>
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ jovem()?.telefone || 'Não informado' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">cake</span>
                <span class="text-slate-600 dark:text-slate-400">{{ jovem()?.dataNascimento ? (jovem()?.dataNascimento | date:'dd/MM/yyyy') : 'Não informado' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">apparel</span>
                <span class="text-slate-600 dark:text-slate-400">Roupa: {{ jovem()?.tamanhoRoupa || '--' }} | Chinelo: {{ jovem()?.tamanhoChinelo || '--' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
                <span class="text-slate-600 dark:text-slate-400">Membro desde {{ jovem()?.dataCadastro | date:'MMM yyyy' }}</span>
              </div>
              @if(jovem()?.novoConvertido) {
                <div class="flex items-center gap-3 text-amber-600 dark:text-amber-500 font-medium pt-2 border-t border-slate-200 dark:border-slate-700/50">
                  <span class="material-symbols-outlined text-[18px]">psychology_alt</span>
                  Novo Convertido
                </div>
              }
            </div>

            <div class="w-full flex flex-col gap-2 mt-4">
              <a [href]="getWhatsAppLink()" target="_blank" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-semibold rounded-full transition-colors shadow-lg shadow-emerald-200/50 dark:shadow-none">
                <span class="material-symbols-outlined text-[18px]">chat</span>
                Enviar Mensagem (WhatsApp)
              </a>
              <div class="flex gap-2">
                <button (click)="openEditModal()" class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-full transition-colors">
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                  Editar
                </button>
                <button routerLink="/presencas" class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                  <span class="material-symbols-outlined text-[18px]">fact_check</span>
                  Presença
                </button>
              </div>
            </div>
            
            <button (click)="deletarJovem()" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-sm font-semibold rounded-full transition-colors mt-2 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20">
              <span class="material-symbols-outlined text-[18px]">delete</span>
              Excluir Jovem
            </button>
          </div>
          
          <!-- Histórico -->
          <div class="md:col-span-2 space-y-6">
            <!-- Histórico -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-500">history</span>
                  Histórico de Presença
                </h3>
              </div>
              
              <div class="divide-y divide-slate-100 dark:divide-slate-700/50 p-2 sm:p-0">
                @if (jovem()?.historicoPresenca?.length === 0) {
                  <div class="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p>Nenhuma presença registrada ainda.</p>
                  </div>
                } @else {
                  @for (hist of historicoEnriquecido(); track hist.evento.id) {
                    <div class="flex items-center p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div class="flex-1">
                        <p class="font-medium text-slate-900 dark:text-white text-sm">{{ hist.evento.nome }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ hist.evento.data | date:'dd/MM/yyyy' }}</p>
                      </div>
                      
                      <div>
                        @if (hist.presente) {
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            <span class="material-symbols-outlined text-[14px] mr-1">check</span> Presente
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300">
                            <span class="material-symbols-outlined text-[14px] mr-1">close</span> Ausente
                          </span>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Trilha de Discipulado / Jornada -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden p-6">
               <div class="flex items-center justify-between mb-6">
                 <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-500">route</span>
                    Trilha de Discipulado
                  </h3>
                  <span class="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                    Nível Top
                  </span>
               </div>
                
                <div class="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 space-y-6">
                  
                  @for(etapa of etapasJornada; track etapa.id) {
                    <div class="relative pl-6 group select-none cursor-pointer" (click)="toggleJornada(etapa.id)">
                      <!-- Timeline Node -->
                      <div class="absolute -left-[13px] top-1 w-6 h-6 rounded-full border-2 bg-white dark:bg-slate-800 flex items-center justify-center transition-colors duration-300"
                           [ngClass]="getJornadaValue(etapa.id) ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-600'">
                        @if(getJornadaValue(etapa.id)) {
                          <div class="w-3 h-3 bg-emerald-500 rounded-full animate-in zoom-in"></div>
                        }
                      </div>
                      
                      <!-- Content Card -->
                      <div class="p-4 rounded-xl border transition-all duration-300"
                           [ngClass]="getJornadaValue(etapa.id) ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'">
                        <div class="flex items-center justify-between mb-1">
                          <h4 class="font-bold text-sm" [ngClass]="getJornadaValue(etapa.id) ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-white'">{{ etapa.titulo }}</h4>
                          <span class="material-symbols-outlined text-[18px]" [ngClass]="getJornadaValue(etapa.id) ? 'text-emerald-500' : 'text-slate-400'">{{ etapa.icon }}</span>
                        </div>
                        <p class="text-xs" [ngClass]="getJornadaValue(etapa.id) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'">{{ etapa.descricao }}</p>
                      </div>
                    </div>
                  }
                  
                </div>
            </div>
            
            <!-- Ações Sugeridas -->
            <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden p-6">
               <h3 class="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span class="material-symbols-outlined text-amber-500">auto_awesome</span>
                  Recomendações
                </h3>
                
                @switch (jovem()?.score) {
                  @case ('verde') {
                    <div class="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm border border-emerald-100 dark:border-emerald-500/20">
                      <p class="font-medium mb-1">Ótimo engajamento!</p>
                      <p class="opacity-90">Considere este jovem para oportunidades de liderança ou voluntariado no próximo evento.</p>
                    </div>
                  }
                  @case ('amarelo') {
                    <div class="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl text-sm border border-amber-100 dark:border-amber-500/20">
                      <p class="font-medium mb-1">Ponto de atenção</p>
                      <ul class="list-disc pl-4 opacity-90 space-y-1 mt-2">
                        <li>Envie uma mensagem amigável de saudade.</li>
                        <li>Pergunte se está tudo bem ou se precisa de oração.</li>
                      </ul>
                    </div>
                  }
                  @case ('vermelho') {
                    <div class="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 rounded-xl text-sm border border-rose-100 dark:border-rose-500/20">
                      <p class="font-medium mb-1">Ação crítica necessária</p>
                      <ul class="list-disc pl-4 opacity-90 space-y-1 mt-2">
                        <li>Ligue diretamente para saber como ele está.</li>
                        <li>Convide-o(a) para um café ou bate-papo informal.</li>
                        <li>Verifique se o líder da célula está acompanhando o caso.</li>
                      </ul>
                    </div>
                  }
                }
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Excluir -->
      @if (showDeleteModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="p-6 text-center">
              <div class="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-rose-600 text-3xl">delete_forever</span>
              </div>
              <h2 class="text-lg font-bold text-slate-800 mb-2">Excluir Jovem?</h2>
              <p class="text-sm text-slate-500 mb-6">Esta ação não pode ser desfeita. Todo o histórico será perdido.</p>
              
              <div class="flex flex-col gap-3">
                <button (click)="confirmDelete()" class="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-rose-200">
                  Sim, excluir agora
                </button>
                <button (click)="cancelDelete()" class="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-full transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      
      <!-- Modal Editar -->
      @if (showEditModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-24 lg:pb-4">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h2 class="text-lg font-semibold text-slate-800 dark:text-white">Editar Jovem</h2>
              <button (click)="closeEditModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div class="p-6 space-y-4 overflow-y-auto">
              <div>
                <label for="editJovemFoto" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Foto (opcional)</label>
                <div class="flex items-center gap-3">
                  @if(editJovem.fotoUrl) {
                    <div class="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700">
                      <img [src]="editJovem.fotoUrl" class="w-full h-full object-cover" alt="Foto Selecionada">
                    </div>
                  }
                  <input id="editJovemFoto" type="file" accept="image/*" (change)="onFileSelected($event, editJovem)" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/20 cursor-pointer">
                </div>
              </div>

              <div>
                <label for="editJovemNome" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome completo</label>
                <input id="editJovemNome" type="text" [(ngModel)]="editJovem.nome" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="editJovemNascimento" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Nascimento</label>
                  <input id="editJovemNascimento" type="date" [(ngModel)]="editJovem.dataNascimento" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                </div>
                <div>
                  <label for="editJovemTelefone" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                  <input id="editJovemTelefone" type="text" [(ngModel)]="editJovem.telefone" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                </div>
              </div>

              <!-- Seção de Medidas -->
              <div class="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-slate-400 text-[20px]">apparel</span>
                  <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tamanhos e Medidas</h3>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="editJovemChinelo" class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tam. Chinelo</label>
                    <input id="editJovemChinelo" type="text" [(ngModel)]="editJovem.tamanhoChinelo" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  </div>
                  <div>
                    <label for="editJovemRoupa" class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tam. Roupa</label>
                    <input id="editJovemRoupa" type="text" [(ngModel)]="editJovem.tamanhoRoupa" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  </div>
                </div>
              </div>
              
              <div>
                <label for="editJovemStatus" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status <span class="text-xs text-slate-500 font-normal ml-1">(Saúde espiritual/frequência)</span></label>
                <select id="editJovemStatus" [(ngModel)]="editJovem.score" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="verde">Verde (Engajado)</option>
                  <option value="amarelo">Amarelo (Atenção)</option>
                  <option value="vermelho">Vermelho (Risco)</option>
                </select>
                <div class="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mx-1"></span><strong>Verde:</strong> Frequente, engajado e participativo.</p>
                  <p><span class="inline-block w-2 h-2 rounded-full bg-amber-500 mx-1"></span><strong>Amarelo:</strong> Faltando algumas vezes, precisa de atenção.</p>
                  <p><span class="inline-block w-2 h-2 rounded-full bg-rose-500 mx-1"></span><strong>Vermelho:</strong> Afastado ou em risco crítico de se afastar.</p>
                </div>
              </div>

              <div class="pt-2 pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="editJovem.novoConvertido" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                  <span class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">Novo Convertido <span class="material-symbols-outlined text-amber-500 text-[16px]">psychology_alt</span></span>
                </label>
              </div>
            </div>
            
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
              <button (click)="closeEditModal()" class="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors uppercase tracking-wider">Cancelar</button>
              <button (click)="saveEditJovem()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full transition-colors shadow-lg shadow-indigo-200 dark:shadow-none uppercase tracking-wider">Salvar</button>
            </div>
          </div>
        </div>
      }
      
    } @else {
      <div class="flex items-center justify-center p-12 h-64 text-slate-500 flex-col">
        <span class="material-symbols-outlined text-4xl animate-spin text-indigo-500 mb-4">rotate_right</span>
        <p>Carregando dados do jovem...</p>
      </div>
    }
  `
})
export class DetalheJovemComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  data = inject(DataService);
  cdr = inject(ChangeDetectorRef);

  jovemId = signal<string>('');
  showDeleteModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  editJovem = {
    nome: '',
    idade: 18,
    dataNascimento: '',
    tamanhoChinelo: '',
    tamanhoRoupa: '',
    telefone: '',
    fotoUrl: '',
    score: 'verde' as StatusScore,
    novoConvertido: false
  };

  etapasJornada = [
    { id: 'visita', titulo: 'Primeira Visita', descricao: 'Recepcionado e seus dados cadastrados.', icon: 'waving_hand' },
    { id: 'integracao', titulo: 'Integração', descricao: 'Participou do evento ou jantar de novatos.', icon: 'groups' },
    { id: 'batismo', titulo: 'Batismo', descricao: 'Desceu às águas.', icon: 'water_drop' },
    { id: 'discipulado', titulo: 'Discipulado / Célula', descricao: 'Inserido e frequente em um pequeno grupo.', icon: 'menu_book' },
    { id: 'servir', titulo: 'Servir / Liderança', descricao: 'Atuando ativamente no Reino.', icon: 'group_add' }
  ] as const;

  getJornadaValue(etapaId: string): boolean {
    const j = this.jovem();
    if (!j?.jornada) return false;
    return (j.jornada as any)[etapaId] || false;
  }

  toggleJornada(etapaId: string) {
    const j = this.jovem();
    if (!j) return;
    
    const currentJornada = j.jornada || { visita: false, integracao: false, batismo: false, discipulado: false, servir: false };
    
    const updatedJornada = { ...currentJornada, [etapaId]: !(currentJornada as any)[etapaId] };
    this.data.updateJovem(j.id, { jornada: updatedJornada as any });
  }

  constructor() {
    this.route.params.subscribe(params => {
      this.jovemId.set(params['id']);
    });
  }

  deletarJovem() {
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const id = this.jovemId();
    if (id) {
      this.data.deleteJovem(id);
      this.router.navigate(['/jovens']);
    }
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
  }

  openEditModal() {
    const j = this.jovem();
    if (j) {
      this.editJovem = {
        nome: j.nome,
        idade: j.idade,
        dataNascimento: j.dataNascimento || '',
        tamanhoChinelo: j.tamanhoChinelo || '',
        tamanhoRoupa: j.tamanhoRoupa || '',
        telefone: j.telefone || '',
        fotoUrl: j.fotoUrl || '',
        score: j.score,
        novoConvertido: j.novoConvertido || false
      };
      this.showEditModal.set(true);
    }
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  getWhatsAppLink(): string {
    const j = this.jovem();
    let num = j?.telefone || '';
    // clean all non numeric chars
    num = num.replace(/\D/g, '');
    
    // Add country code if it doesn't have it (assuming Brazil 55)
    if (num.length === 10 || num.length === 11) {
      num = '55' + num;
    }
    
    let mensagem = `Olá ${j?.nome}! Tudo bem? Sentimos sua falta.`;
    if (j?.score === 'verde') {
      mensagem = `Olá ${j?.nome}! Tudo bem? Passando para lembrar que teremos encontro essa semana!`;
    }
    
    return `https://wa.me/${num}?text=${encodeURIComponent(mensagem)}`;
  }

  saveEditJovem() {
    if (!this.editJovem.nome) return;
    this.data.updateJovem(this.jovemId(), this.editJovem);
    this.closeEditModal();
  }

  jovem = computed(() => {
    return this.data.jovens().find(j => j.id === this.jovemId());
  });

  historicoEnriquecido = computed(() => {
    const j = this.jovem();
    if (!j) return [];
    
    return j.historicoPresenca.map(hist => {
      const evento = this.data.eventos().find(e => e.id === hist.eventoId)!;
      return { ...hist, evento };
    }).sort((a, b) => new Date(b.evento.data).getTime() - new Date(a.evento.data).getTime());
  });

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onFileSelected(event: Event, targetObj: { fotoUrl?: string | null }) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 512;
        const MAX_HEIGHT = 512;
        let width = img.width;
        let height = img.height;

        // Validating dimensions
        if (width <= 0 || height <= 0) return;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white to avoid black on transparent PNG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          targetObj.fotoUrl = canvas.toDataURL('image/jpeg', 0.85);
          this.cdr.detectChanges();
        }
      };
      img.onerror = () => {
         alert('Erro ao carregar a imagem. Verifique se o arquivo não está corrompido e tente novamente (formatos ideais: JPG, PNG).');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  getBadgeClass(score: StatusScore): string {
    switch (score) {
      case 'verde': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'amarelo': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'vermelho': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  }

  getDotClass(score: StatusScore): string {
    switch (score) {
      case 'verde': return 'bg-emerald-500';
      case 'amarelo': return 'bg-amber-500';
      case 'vermelho': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  }
}
