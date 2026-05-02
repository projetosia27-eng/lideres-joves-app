import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../data.service';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-materiais',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8 flex flex-col h-full overflow-hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <h1 class="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
          <span class="material-symbols-outlined text-[32px] text-indigo-500 drop-shadow-sm">menu_book</span>
          Estudos E Dinâmicas
        </h1>
        
        <div class="flex bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto hide-scrollbar border border-slate-200 dark:border-white/5 backdrop-blur-md">
          <button 
             (click)="activeTab.set('repo')" 
             [class.bg-white]="activeTab() === 'repo'"
             [class.text-indigo-600]="activeTab() === 'repo'"
             [class.shadow-md]="activeTab() === 'repo'"
             [class.dark:bg-indigo-500/20]="activeTab() === 'repo'"
             [class.dark:text-indigo-400]="activeTab() === 'repo'"
             [class.text-slate-500]="activeTab() !== 'repo'"
             class="px-5 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider">Meu Repositório</button>
          <button 
             (click)="activeTab.set('estudos')" 
             [class.bg-white]="activeTab() === 'estudos'"
             [class.text-indigo-600]="activeTab() === 'estudos'"
             [class.shadow-md]="activeTab() === 'estudos'"
             [class.dark:bg-indigo-500/20]="activeTab() === 'estudos'"
             [class.dark:text-indigo-400]="activeTab() === 'estudos'"
             [class.text-slate-500]="activeTab() !== 'estudos'"
             class="px-5 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider">Estudos p/ Líderes</button>
          <button 
             (click)="activeTab.set('dinamicas')" 
             [class.bg-white]="activeTab() === 'dinamicas'"
             [class.text-indigo-600]="activeTab() === 'dinamicas'"
             [class.shadow-md]="activeTab() === 'dinamicas'"
             [class.dark:bg-indigo-500/20]="activeTab() === 'dinamicas'"
             [class.dark:text-indigo-400]="activeTab() === 'dinamicas'"
             [class.text-slate-500]="activeTab() !== 'dinamicas'"
             class="px-5 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider">Dinâmicas</button>
          <button 
             (click)="activeTab.set('livros')" 
             [class.bg-white]="activeTab() === 'livros'"
             [class.text-indigo-600]="activeTab() === 'livros'"
             [class.shadow-md]="activeTab() === 'livros'"
             [class.dark:bg-indigo-500/20]="activeTab() === 'livros'"
             [class.dark:text-indigo-400]="activeTab() === 'livros'"
             [class.text-slate-500]="activeTab() !== 'livros'"
             class="px-5 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap uppercase tracking-wider">Livros Recomendados</button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-2 pb-8">
        @if (activeTab() === 'repo') {
          <div class="space-y-6">
            <div class="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-500/5 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 backdrop-blur-sm">
              <h2 class="text-sm font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">Repositório de Links e PDFs salvos</h2>
              <button disabled class="inline-flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600/50 dark:bg-indigo-600/30 cursor-not-allowed text-white dark:text-white/70 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm">
                + Novo Material
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (material of data.materiais(); track material.id) {
                <!-- Item do Repositório -->
                <div class="card-premium overflow-hidden group flex flex-col h-full cursor-pointer hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all">
                  <div class="h-36 relative overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-white/5" [class]="getBgClass(material.tipo)">
                    <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                    <span class="material-symbols-outlined text-[64px] text-white transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500 drop-shadow-lg">
                      {{ getIcon(material.tipo) }}
                    </span>
                    <div class="absolute top-4 right-4">
                      <span class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/90 text-slate-900 shadow-sm backdrop-blur-md">
                        {{ material.tipo }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="p-6 flex flex-col flex-1 bg-white/50 dark:bg-[#0a0a0c]/50 backdrop-blur-md">
                    <h3 class="text-xl font-display font-bold text-slate-800 dark:text-white mb-3 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ material.titulo }}</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1 line-clamp-3 font-medium">{{ material.descricao }}</p>
                    
                    <div class="flex items-center justify-between mt-auto">
                      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{{ material.dataPublicacao | date:'dd/MM/yyyy' }}</span>
                      <a [href]="material.link" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300">
                        Acessar
                        <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
            
            @if (data.materiais().length === 0) {
              <div class="w-full p-16 text-center card-premium border-dashed flex flex-col items-center justify-center">
                <span class="material-symbols-outlined text-6xl mb-4 text-slate-300 dark:text-slate-600 drop-shadow-md">playlist_add_check_circle</span>
                <p class="font-display text-xl font-bold text-slate-800 dark:text-white mb-2">Repositório Vazio</p>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Em breve você poderá adicionar links e PDFs personalizados aqui.</p>
              </div>
            }
          </div>
        }


        @if (activeTab() === 'estudos') {
          <div class="space-y-6">
            <p class="text-slate-600 dark:text-slate-400 font-medium">Seleção de estudos focados no desenvolvimento e desafios dos jovens de hoje.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @for (estudo of curadoriaEstudos; track estudo.titulo) {
                <div class="card-premium p-6 flex flex-col hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all group">
                  <div class="flex items-start gap-4 mb-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-500/20 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-[28px] drop-shadow-md">{{ estudo.icon }}</span>
                    </div>
                    <div>
                      <h3 class="text-xl font-display font-bold text-slate-800 dark:text-white leading-tight mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{{ estudo.titulo }}</h3>
                      <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 uppercase tracking-widest">{{ estudo.tempo }}</span>
                        <span class="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">{{ estudo.formato }}</span>
                      </div>
                    </div>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 text-sm flex-1 mb-6 font-medium">{{ estudo.descricao }}</p>
                  
                  <div class="flex gap-3 mt-auto">
                    @if (estudo.formato === 'Texto no App') {
                      <button (click)="openEstudo(estudo)" class="flex-1 py-3 px-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-black tracking-widest uppercase rounded-xl hover:bg-indigo-500 hover:text-white hover:border-indigo-500 dark:hover:bg-indigo-600 transition-colors text-center inline-flex items-center justify-center gap-2 group/btn">
                        <span class="material-symbols-outlined text-[18px]">menu_book</span> Ler Estudo
                      </button>
                    }
                    @if (estudo.formato === 'PDF') {
                      <button (click)="openPdfModal(estudo.link, estudo.titulo)" class="flex-1 py-3 px-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-black tracking-widest uppercase rounded-xl hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-600 transition-colors text-center inline-flex items-center justify-center gap-2 group/btn">
                        <span class="material-symbols-outlined text-[18px]">visibility</span> Abrir PDF
                      </button>
                    }
                    @if (estudo.formato !== 'Texto no App' && estudo.formato !== 'PDF') {
                      <a [href]="estudo.link" target="_blank" rel="noopener noreferrer" class="flex-1 py-3 px-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-black tracking-widest uppercase rounded-xl hover:bg-indigo-500 hover:text-white hover:border-indigo-500 dark:hover:bg-indigo-600 transition-colors text-center inline-flex items-center justify-center gap-2 group/btn">
                        <span class="material-symbols-outlined text-[18px]">open_in_new</span> Acessar Link
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (activeTab() === 'dinamicas') {
          <div class="space-y-6">
            <p class="text-slate-600 dark:text-slate-400 font-medium">Banco de dinâmicas quebra-gelo, comunhão e reflexão prontas para usar na sua célula ou encontro.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (dinamica of curadoriaDinamicas; track dinamica.titulo) {
                <div class="card-premium p-6 flex flex-col hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all cursor-pointer group" (click)="openDinamica(dinamica)">
                  <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-display font-bold text-slate-800 dark:text-white leading-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{{ dinamica.titulo }}</h3>
                    <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-[20px]">sports_esports</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 mb-4 flex-wrap">
                    <span class="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">{{ dinamica.objetivo }}</span>
                    <span class="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10"><span class="material-symbols-outlined text-[14px]">group</span> {{ dinamica.tamanhoGrupo }}</span>
                  </div>
                  <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 font-medium flex-1 mb-6">{{ dinamica.instrucoes }}</p>
                  <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 uppercase tracking-widest flex items-center gap-1 transition-colors mt-auto">
                    Ver Como Aplicar <span class="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </p>
                </div>
              }
            </div>
          </div>
        }

        @if (activeTab() === 'livros') {
          <div class="space-y-6">
            <p class="text-slate-600 dark:text-slate-400 font-medium">Recomendações curadas de livros essenciais para a formação de líderes de jovens.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (livro of curadoriaLivros; track livro.titulo) {
                <div class="card-premium flex flex-col overflow-hidden hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all group">
                  <div class="bg-indigo-50/50 dark:bg-indigo-900/10 p-0 flex justify-center items-center h-64 border-b border-indigo-100 dark:border-white/5 relative overflow-hidden">
                     @if (livro.capaUrl) {
                       <img [src]="livro.capaUrl" [alt]="livro.titulo" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal" referrerpolicy="no-referrer">
                       <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/80 via-transparent to-transparent"></div>
                     } @else {
                       <span class="material-symbols-outlined text-[80px] text-indigo-300 dark:text-indigo-500/30 group-hover:scale-110 transition-transform duration-500 drop-shadow-md">import_contacts</span>
                     }
                     @if (livro.badge) {
                       <span class="absolute top-4 right-4 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-orange-500/30 backdrop-blur-sm">{{ livro.badge }}</span>
                     }
                     
                     <div class="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                        <p class="font-display font-bold text-lg leading-tight">{{ livro.titulo }}</p>
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/70">{{ livro.autor }}</p>
                     </div>
                  </div>
                  <div class="p-6 flex-1 flex flex-col bg-white/50 dark:bg-[#0a0a0c]/50">
                    <h3 class="text-xl font-display font-bold text-slate-800 dark:text-white mb-1 group-hover:text-indigo-500 transition-colors">{{ livro.titulo }}</h3>
                    <p class="text-xs font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-4">{{ livro.autor }}</p>
                    <p class="text-sm font-medium text-slate-500 dark:text-slate-400 flex-1 mb-6 line-clamp-3">{{ livro.descricao }}</p>
                    <div class="flex items-center justify-between mt-auto">
                      <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                        <span class="material-symbols-outlined text-[14px] text-slate-500">category</span>
                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{{ livro.categoria }}</span>
                      </div>
                      
                      @if (livro.linkCompra) {
                        <a [href]="livro.linkCompra" target="_blank" rel="noopener noreferrer" class="py-2 px-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors inline-flex items-center gap-1.5 shadow-sm group/btn">
                          <span class="material-symbols-outlined text-[14px] group-hover/btn:scale-110 transition-transform">shopping_cart</span> Comprar
                        </a>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- PDF Viewer Modal -->
      @if (pdfModalOpen()) {
        <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 pb-20 sm:pb-6">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <h2 class="font-semibold text-slate-800 dark:text-white truncate pr-4 text-sm sm:text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-red-500">picture_as_pdf</span>
                {{ selectedPdfTitle() }}
              </h2>
              <div class="flex items-center gap-2">
                <a [href]="selectedPdfUrl()" target="_blank" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="Abrir em Nova Aba">
                  <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
                <button (click)="closePdfModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="Fechar">
                  <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <!-- object / embed ou iframe. o Google Docs viewer pode ser util -->
            <div class="flex-1 bg-slate-200 dark:bg-slate-900 w-full overflow-hidden">
              <iframe [src]="getSafeUrl(selectedPdfUrl())" class="w-full h-full border-0 bg-white" title="PDF Viewer" allowfullscreen></iframe>
            </div>
          </div>
        </div>
      }

      <!-- Estudo Modal -->
      @if (selectedEstudo()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 pb-20 sm:pb-4">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800">
              <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><span class="material-symbols-outlined text-indigo-500">{{ selectedEstudo()?.icon }}</span> {{ selectedEstudo()?.titulo }}</h2>
              <button (click)="closeEstudo()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {{ selectedEstudo()?.conteudo }}
            </div>
          </div>
        </div>
      }

      <!-- Dinamica Modal -->
      @if (selectedDinamica()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 sm:pb-4">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div class="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800">
              <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><span class="material-symbols-outlined text-emerald-500">extension</span> {{ selectedDinamica()?.titulo }}</h2>
              <button (click)="closeDinamica()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div class="p-4 sm:p-6 overflow-y-auto space-y-6">
              <div class="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
                <div class="flex items-start gap-3 text-sm">
                  <span class="material-symbols-outlined text-emerald-500 mt-0.5 text-[20px]">flag</span>
                  <div>
                    <strong class="text-slate-800 dark:text-white block mb-0.5">Objetivo</strong>
                    <span class="text-slate-600 dark:text-slate-400">{{ selectedDinamica()?.objetivo }}</span>
                  </div>
                </div>
                <div class="flex items-start gap-3 text-sm">
                  <span class="material-symbols-outlined text-blue-500 mt-0.5 text-[20px]">group</span>
                  <div>
                    <strong class="text-slate-800 dark:text-white block mb-0.5">Participantes</strong>
                    <span class="text-slate-600 dark:text-slate-400">{{ selectedDinamica()?.tamanhoGrupo }}</span>
                  </div>
                </div>
                <div class="flex items-start gap-3 text-sm">
                  <span class="material-symbols-outlined text-orange-500 mt-0.5 text-[20px]">inventory_2</span>
                  <div>
                    <strong class="text-slate-800 dark:text-white block mb-0.5">Materiais</strong>
                    <span class="text-slate-600 dark:text-slate-400">{{ selectedDinamica()?.materiaisLista }}</span>
                  </div>
                </div>
              </div>
              
              <div class="space-y-3">
                <h4 class="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                  <span class="material-symbols-outlined text-indigo-500">format_list_numbered</span>
                  Como aplicar
                </h4>
                <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                  {{ selectedDinamica()?.instrucoes }}
                </div>
              </div>
              
              <div class="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                <h4 class="font-bold text-indigo-800 dark:text-indigo-300 text-sm mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">lightbulb</span> Conclusão / Reflexão</h4>
                <p class="text-indigo-700/90 dark:text-indigo-200 text-sm whitespace-pre-line leading-relaxed">
                  {{ selectedDinamica()?.reflexao }}
                </p>
              </div>
            </div>
            
            <div class="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
               <button (click)="closeDinamica()" class="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-700 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MateriaisComponent {
  data = inject(DataService);
  sanitizer = inject(DomSanitizer);
  
  activeTab = signal<'repo' | 'estudos' | 'dinamicas' | 'livros'>('repo');
  
  pdfModalOpen = signal(false);
  selectedPdfUrl = signal('');
  selectedPdfTitle = signal('');
  
  selectedEstudo = signal<any>(null);
  selectedDinamica = signal<any>(null);

  curadoriaEstudos = [
    {
      titulo: 'Os Perigos do Relativismo (Jovens)',
      descricao: 'Baseado no material da CPAD. Um estudo forte sobre como manter os valores cristãos intocáveis diante da cultura atual.',
      icon: 'shield',
      tempo: 'Estudo 1 Hora',
      formato: 'Texto no App',
      conteudo: 'A geração atual tem abraçado o relativismo moral ("cada um tem a sua verdade"). Mas a Palavra de Deus é imutável.\n\n1. O que é a verdade?\nJesus é a Verdade. Diferente da sociedade que vê a verdade como um conceito filosófico ou fluido, o verdadeiro discípulo de Cristo vê a verdade como uma Pessoa (Jo 14:6).\n\n2. O perigo do secularismo na Igreja\nDevemos estar no mundo para ser luz, mas não ser moldados por ele. A amizade com o mundo é um perigo real que afeta nossas conversas, consumo e amizades.\n\n3. Firmados na Rocha em meio à Tempestade\nAs tempestades vieram, vêm e sempre virão sobre a juventude. Apenas os que estão fundamentados nas doutrinas e nos valores apostólicos puros não desabarão frente às novas ideologias.\n\nAplicação Prática (Debate em Célula ou Grupo):\nIdentifiquem três "verdades" atuais do mundo que são completamente inversas às verdades irrefutáveis de Cristo.',
      link: ''
    },
    {
      titulo: 'A Doutrina do Espírito Santo (Estilo EBD)',
      descricao: 'Ensinamentos clássicos no estilo Revista CPAD sobre a pessoa e o operar do Consolador para juventude pentecostal.',
      icon: 'local_fire_department',
      tempo: 'Estudo Completo',
      formato: 'Texto no App',
      conteudo: 'Muitos jovens perdem as maravilhas do Espírito Santo por não buscarem profundidade na Palavra sobre o tema.\n\n1. Quem é o Espírito Santo?\nAo contrário do que vemos em algumas correntes místicas, o Espírito Santo não é apenas "um vento" ou "energia". É a terceira pessoa da Trindade! Ele tem vontade, ensina, guia, intercede, e pode ser entristecido.\n\n2. A Promessa de Atos 2 é Atual\n"E nos últimos dias acontecerá, diz Deus, que do meu Espírito derramarei sobre toda a carne". O avivamento pentecostal não ficou cravado na história do passado, ele está batendo na porta de nossa geração atual.\n\n3. Consonância entre o Fruto e os Dons\nBuscar poder e carismas (Dons) ignorando as fundações do caráter (Frutos) gera lideranças jovens distorcidas e perigosas. O amor é a virtude motriz (1 Coríntios 13).\n\nDesafio de Vida:\nEncerre este devocional separando 15 minutos em clamor e quebrantamento por mais aprofundamento espiritual na Palavra!',
      link: ''
    },
    {
      titulo: 'Manual do Discipulado Prático',
      descricao: 'Princípios fundamentais para discipular a nova geração. Focado em relacionamentos intencionais, quebra de paradigmas e integração no Reino.',
      icon: 'menu_book',
      tempo: 'Estudo Completo',
      formato: 'Texto no App',
      conteudo: 'O Chamado para Discipular...\n\nJesus não chamou multidões para apenas ouvir, mas para seguir e compartilhar a vida. Como podemos aplicar isso hoje na juventude?\n\n1. Relacionamentos Intencionais:\nPassar tempo junto além das reuniões é o segredo do discipulado. Comer junto, jogar junto.\n\n2. Exemplo de Vida:\n"Sede meus imitadores" (1 Coríntios 11:1). As palavras ensinam, mas o exemplo arrasta. Seus liderados vão reproduzir sua paixão por Deus e também os seus defeitos de liderança.\n\n3. Oração Constante:\nOrar com os jovens e orar pelas lutas escondidas deles.\n\n4. Compartilhamento de Fraquezas:\nLíderes inalcançáveis criam jovens frustrados. Seja humano, mostre como a graça de Deus te ajuda nas falhas.\n\nAtividade Pós-Estudo:\nIdentifique 3 jovens nesta semana que estão "afastados" e convide-os para um lanche ou açaí. Não faça disso um interrogatório, apenas ame-os.',
      link: '' 
    },
    {
      titulo: 'Identidade e Propósito na Juventude',
      descricao: 'Um estudo prático sobre como lidar com as crises de identidade modernas baseando-se na Palavra.',
      icon: 'psychology',
      tempo: 'Série',
      formato: 'Texto no App',
      conteudo: 'Vivemos na era da comparação. As redes sociais se tornaram o espelho da nossa geração. Por isso, a juventude constantemente se pergunta "Quem sou eu?" e "Para que estou aqui?".\n\n1. Nossa Identidade Primária (Efésios 1)\nNossa identidade não é o nosso vestibular, não é nossa estética, nem nossa força de trabalho. Nossa verdadeira identidade é: Fomos adotados, somos "Filhos amados".\n\n2. Cuidado com falsos rótulos \nMuitas vezes abraçamos rótulos (ansioso, depressivo, burro, feio) impostos por outros ou pelos nossos próprios fracassos.\n\n3. Como construir o Propósito\nO propósito não se acha magicamente, ele é cultivado servindo ao próximo. A vontade de Deus é quase sempre responder a uma necessidade real no Reino sendo cheio do Espírito Santo.\n\nAplicação ou Dinâmica Rápida:\nPeça para os jovens anotarem em um papel o pior rótulo que já receberam. Em seguida, amassem, joguem no chão e leiam Romanos 8 a respeito da nova identidade em Cristo.',
      link: '' 
    },
    {
      titulo: 'Guia de Aconselhamento para Líderes',
      descricao: 'Cartilha básica de como ouvir, aconselhar e encaminhar os jovens.',
      icon: 'volunteer_activism',
      tempo: 'Guia Prático',
      formato: 'Texto no App',
      conteudo: 'Passos para um aconselhamento cristão seguro:\n\n1. Acessibilidade e Escuta Ativa\nO jovem precisa se sentir 100% seguro de que aquilo não vai parar nos ouvidos da igreja inteira. Ouça para entender a dor completa dele, não apenas para jogar um versículo rápido como resposta.\n\n2. Evite o Julgamento Precoce e Valide a Dor\nNão minimize dizendo "isso é falta de fé" ou "só orar que passa". Valide: "Eu posso imaginar o quanto isso está sendo pesado. Deus está com você e eu também estou."\n\n3. Limite de Atuação\nLíder de jovens não é psicólogo e nem psiquiatra. Em casos de abuso, depressão severa e ideações suicidas, você deve imediatamente orientar o jovem e a família dele a procurar um psicólogo ou tratamento profissional.\n\n4. Direcionamento Bíblico e Oração\nTraga conforto. Textos como Salmos 139 e Salmo 23 são poderosos para crises de ansiedade. Finalize o aconselhamento orando.\n\n5. Follow-Up (Acompanhamento)\nNão deixe por isso mesmo. Três dias depois, mande uma mensagem "Estou orando por você, como você está?". Isso salva vidas!',
      link: '' 
    },
    {
      titulo: 'Como Preparar Reuniões Inesquecíveis',
      descricao: 'Dicas práticas de estrutura, engajamento e ordem de culto de jovens.',
      icon: 'tips_and_updates',
      tempo: 'Dicas Rápidas',
      formato: 'Texto no App',
      conteudo: 'A juventude tem um perfil muito diferente de outras idades. Precisamos ser intencionais na formatação dos encontros sem perder a essência do Evangelho.\n\n- Chegada / Lanchonete / Música (15min)\nColoque uma playlist de base, deixe um líder no portão recebendo com abraço e muita energia. Primeira impressão é fundamental.\n\n- Quebra-Gelo / Dinâmica Rápida (10min)\nPara uma Célula, vital. Crie unidade.\n\n- Louvor (20min a 30min)\nNão enrole. Escolham 3 a 5 músicas com um crescendo adequado.\n\n- Palavra e Desafio (30 a 40min)\nTente sempre responder: "O que eu faço com o que aprendi hoje?". Culto de Jovem que não traz desafio prático pra semana, não engaja. Use bastante histórias, Jesus gostava de parábolas por um motivo: ilustram a verdade.\n\n- Apelo, Oração e Desfecho (15min)\nCrie apelos focados nas dores e áreas (porno, familia, etc). Não deixe o fechamento desabar.',
      link: ''
    }
  ];

  curadoriaDinamicas = [
    {
      titulo: 'A Teia da Comunhão',
      objetivo: 'Integração e Quebra-Gelo',
      tamanhoGrupo: '10 a 30 pessoas',
      materiaisLista: 'Um rolo de barbante grosso.',
      instrucoes: '1. Peça para todos formarem um grande círculo.\n2. O líder segura a ponta do barbante, diz seu nome e uma característica sua ou hobby, e então joga o rolo para outra pessoa.\n3. A pessoa que pega faz o mesmo e joga para outro.\n4. Ao final, forma-se uma grande "teia" de aranha ligando todos.',
      reflexao: 'Mostrar que todos estamos conectados. A ação de um afeta a todos na teia. Se um soltar o barbante, a teia fica frouxa (A importância de cada membro no corpo).'
    },
    {
      titulo: 'Balões dos Problemas',
      objetivo: 'Alívio de Ansiedade / Confiança',
      tamanhoGrupo: 'Qualquer tamanho',
      materiaisLista: 'Balões vazios e canetas/marcadores.',
      instrucoes: '1. Distribua um balão vazio para cada pessoa.\n2. Peça que encham e dêem um nó.\n3. Com o marcador, cada um deve escrever uma palavra ou desenhar um símbolo que represente uma dificuldade ou preocupação atual.\n4. Ao som de uma música, luzes apagadas, todos batem nos balões para cima não deixando cair. \n5. Em seguida, podem pisar para estourá-los.',
      reflexao: 'Quando tentamos segurar os problemas de todos sozinhos, é impossível. No fim, somos chamados para entregar nossos problemas a Deus e estourar essa pressão (1 Pedro 5:7).'
    },
    {
      titulo: 'Caixa dos Segredos (Dúvidas Anônimas)',
      objetivo: 'Aprofundamento Prático',
      tamanhoGrupo: 'Ideal para grupos pequenos e de confiança',
      materiaisLista: 'Caixa furada em cima, papel e caneta.',
      instrucoes: '1. Distribua pedaços de papel.\n2. Peça que escrevam uma dúvida profunda, vergonhosa ou pedido de oração.\n3. Escrevam com letra de forma para anonimato, dobrem e ponham na caixa.\n4. Misture, sorteie e discuta.' ,
      reflexao: 'Muitas dúvidas são compartilhadas e escondidas por vergonha. Juntos criamos um ambiente de cura.'
    },
    {
      titulo: 'O Nό Humano',
      objetivo: 'Trabalho em Equipe e Liderança',
      tamanhoGrupo: '8 a 12 pessoas por roda',
      materiaisLista: 'Nenhum.',
      instrucoes: '1. Façam um pequeno círculo ombro a ombro.\n2. Fechem os olhos e estendam os braços para frente.\n3. Peguem nas mãos de pessoas diferentes.\n4. Abram os olhos para ver o "nó".\n5. O desafio é desatar o nó sem soltar as mãos (passando por baixo etc).',
      reflexao: 'A confusão existe sempre em relacionamentos. Com comunicação pacífica, o que parece um nó se torna uma união perfeita.'
    },
    {
      titulo: 'Torta na Cara Bíblica (Gincana)',
      objetivo: 'Competição Teológica Divertida',
      tamanhoGrupo: 'Qualquer',
      materiaisLista: 'Pratos descartáveis, chantilly/espuma de barbear, campainha/sino pequeno.',
      instrucoes: '1. Dividir em duas equipes fortes. O líder chama 1 competidor de cada vez que ficam de frente para a mesa.\n2. Líder lê pergunta biblica.\n3. O primeiro que tocar a campainha responde.\n4. Acertou? Dá torta no rosto do adversário. Errou? O outro te dá a torta!',
      reflexao: 'Estimula de forma leve que o jovem se interesse pelo conhecimento bíblico. Ótimo final de culto de jovem vibrante.'
    },
    {
      titulo: 'Corrida do Versículo (Gincana)',
      objetivo: 'Manusear a Bíblia',
      tamanhoGrupo: 'Equipes ou individual',
      materiaisLista: 'Bíblias físicas (proibido aplicativo!).',
      instrucoes: '1. O moderador cita a referência: "Salmo 23:4".\n2. Os participantes precisam abrir a Bíblia e localizar.\n3. O primeiro que levantar da cadeira ou gritar "ACHEI" deve ler corretamente. Ganha os pontos para o time.',
      reflexao: 'Ajuda quem não sabe onde ficam os livros da Bíblia a procurar de forma interativa e com pressão positiva.'
    },
    {
      titulo: 'Qual é a Música Gospel? (Gincana)',
      objetivo: 'Competição Alegre e Despertamento',
      tamanhoGrupo: '2 a 4 times',
      materiaisLista: 'Celular plugado na mesa de som ou caixa bluetooth. Playlist de louvores conhecidos.',
      instrucoes: '1. Coloque a música para tocar exatamente 3 a 5 segundos do comecinho e pause imediatamente.\n2. O grupo precisa adivinhar na rapidez e continuar cantando sem errar a letra.',
      reflexao: 'Além da zoeira saudável, ele quebra muito a frieza antes de um culto e aquece os corações para adorar logo depois.'
    },
    {
      titulo: 'Mímica Maluca e Tabu Cristão',
      objetivo: 'Atuação e Integração',
      tamanhoGrupo: 'Equipes de 5+',
      materiaisLista: 'Fichas com palavras.',
      instrucoes: 'Sorteia-se um animal (leão da tribo, pomba, urso, asna), personagem (Golias, Zaqueu, Jonas) ou milagre. Sem emitir um som sequer (ou sem falar palavras proibidas), a equipe precisa faturar a resposta em 60 segundos!',
      reflexao: 'Fortalece vínculos na Célula através do lado lúdico.'
    },
    {
      titulo: 'Duas Verdades e Uma Mentira',
      objetivo: 'Quebra-gelo Inicial / Se Conhecer',
      tamanhoGrupo: 'Toda a Célula ou evento',
      materiaisLista: 'Nenhum.',
      instrucoes: '1. Cada jovem diz 3 fatos ou experiências bizarras sobre si mesmo (ex: "Ja comi grilo frito", "Já cai de moto" e "Tenho 8 dedos").\n2. Dois fatos têm que ser 100% verídicos e um falso.\n3. O grupo vota pra descobrir a mentira.',
      reflexao: 'Conhecer histórias ajuda nas conexões íntimas.'
    },
    {
      titulo: 'Desarmando a Bomba',
      objetivo: 'Aprender a Discernir a Voz Certa',
      tamanhoGrupo: '10 a 20',
      materiaisLista: 'Vendas para os olhos, chaves ou moedas (as bombas).',
      instrucoes: '1. Vende os olhos de 2 competidores num campo cheio de cadeiras.\n2. Escolhem "1 guia verdadeiro" na sua equipe.\n3. Encha o salão de gente (equipe inimiga gritando ordem falsa, guia falando a correta).\n4. Eles têm que achar a moeda de olhos vendados confiando só na voz amiga.',
      reflexao: 'Quem tem sido o seu "guia"? No mundo há 100 mil vozes gritando opiniões para a Juventude. Apenas precisamos sintonizar na Verdadeira (João 10).'
    },
    {
      titulo: 'Identidade Oculta: "Quem sou eu?"',
      objetivo: 'Ensinamento em História',
      tamanhoGrupo: 'Livre',
      materiaisLista: 'Post-its com nomes.',
      instrucoes: '1. Cole na testa das pessoas um post-it sem que elas leiam, com nome bíblico.\n2. Eles andando pelo pátio precisam fazer perguntas restritas ao "SIM" ou "NÃO". Ex: "Sou apóstolo?", "Fui cortado ao meio?".\n3. Quem acerta primeiro, ganha.',
      reflexao: 'Fixa a jornada e vida de vários marcos de forma prática.'
    },
    {
      titulo: 'Construindo A Torre de Equilíbrio',
      objetivo: 'Edificação Sólida / Trabalho em Equipe',
      tamanhoGrupo: 'Grupos de 4',
      materiaisLista: 'Pacotes de espaguete cru, fita adesiva, ou marshmallow.',
      instrucoes: 'Vocês têm 8 minutos. Construam a torre mais alta que permaneça em pé sozinha por pelo menos 10 segundos! A equipe tenta balancear a base.',
      reflexao: 'A torre precisa de uma fundação resistente (MATEUS 7: A casa na Rocha). A vida sem bases firmes rui quando solto.'
    },
    {
      titulo: 'Dança das Cadeiras Cooperativa',
      objetivo: 'Companheirismo e Não Exclusão',
      tamanhoGrupo: 'Roda livre',
      materiaisLista: 'Cadeiras e Rádio.',
      instrucoes: 'Tradicional: musica para, todos sentam. Porém, aqui, NINGUÉM SAI! Conforme tira a cadeira, eles precisam dar um jeito de todos estarem acomodados (sentar na coxa, amontoar). Se alguém botar o pé no chão, todos perdem.',
      reflexao: 'A mentalidade de Igreja: Carregar o peso um do outro e nunca excluir uma ovelha porque falta espaço.'
    },
    {
      titulo: 'O Jogo dos Privilégios (Passo a Passo)',
      objetivo: 'Quebra de Privilégio, Empatia Radical',
      tamanhoGrupo: 'Pode ser aplicado no chão de uma quadra.',
      materiaisLista: 'Espaço aberto longo.',
      instrucoes: 'Coloque a galera toda enfileirada, lado a lado. Leia sentenças. Quem disser sim, dá 1 passo a frente. "Se voce tem os pais casados de um passo", "Se voce não se preocupa em ter energia eletrica, de um passo", "se voce ja passou depressão, fique". \nNo final as pessoas distantes notarão as desigualdades.',
      reflexao: 'Entenda a base de largada do irmão que pecou, ou de onde ele veio. Peguemos mais leve. Amem uns aos outros onde estão.'
    },
    {
      titulo: 'Barco Salva Vidas',
      objetivo: 'Confrontar Julgamentos Internos',
      tamanhoGrupo: 'Grupos de debate',
      materiaisLista: 'Nenhum.',
      instrucoes: 'Dê 1 caso: Um navio afunda e só resta 1 pequeno bote para 2 pessoas. Existem 5 naufragos: 1 padre idoso, 1 ex-traficante recem convertido, 1 mulher gravida que odeia criancas, um policial e um cachorro.\nDiscutam e escolham democraticamente APENAS 2 pra sobreviver.',
      reflexao: 'Os preconceitos aparecem nas escolhas. Entram pra uma bela pauta sobre quem merece de fato o amor de Deus (Todos!).'
    },
    {
      titulo: 'Escultura Cega de Genesis',
      objetivo: 'Modelando com confiança sob pressao',
      tamanhoGrupo: 'Pequenas Equipes',
      materiaisLista: 'Um pedaço de massinha ou argila e uma venda.',
      instrucoes: 'Um membro de cada grupo recebe a venda. Os outros recebem o cartao, ex: "Um Camelo". A equipe deve instruir oralmente o cego a esculpir a massinha!',
      reflexao: 'Exalta o poder da instrução divina (Bíblia) para nos modelar em meio à escuridao.'
    },
    {
      titulo: 'Telefone sem fio Desenhado',
      objetivo: 'Hilaridade e Efeitos da Fofoca',
      tamanhoGrupo: '6 pessoas pelo menos',
      materiaisLista: 'Papel dobrado e Caneta.',
      instrucoes: '1. O líder dá a sentença pro Nº 1. Ele escreve\n2. Passa, o Nº2 desenha e DOBRA pra esconder a frase original\n3. O Nº3 vê o desenho, decifra em texto e dobra\n4. E assim segue...',
      reflexao: 'No fim, todos vão rir que a Arca de Noé virou um Barco Sushi! Mensagem: "O estrago da fofoca. (Tiago 3)"'
    },
    {
      titulo: 'Campo Minado',
      objetivo: 'Cuidado nos Relacionamentos',
      tamanhoGrupo: 'Duplas espalhadas',
      materiaisLista: 'Centenas de copos de plastico soltos esparramados.',
      instrucoes: 'Toda area forrada de copos invertidos (minas terrestres). Uma pessoa da dupla usa venda. A outra a conduz verbalmente pra cruzar a sala sem amassar as "minas" e fazer barulho.',
      reflexao: 'Mostre como no discipulado os lideres guiam ovelhas em terrenos escorregadios em tempos de juventude.'
    },
    {
      titulo: 'Desafio do Limão',
      objetivo: 'Reconhecer qualidades únicas',
      tamanhoGrupo: 'Célula toda',
      materiaisLista: 'Um saco de limoes limpos mas com texturas.',
      instrucoes: 'Coloque 1 limão na mão de cada. Mande sentir furos, manchas... por 2 minutos de forma profunda. Agora, bote todos numa bacia. Cada jovem deve recuperar o seu limão certinho usando sua tatica visual e memórica.',
      reflexao: 'Se olhados por cima parecemos iguais ou apenas limões na multidão. Mas pro Deus Todo-Poderoso (e para bons discipuladores) nossas "marcas", arranhões e peculiaridades nos tornam únicos e conhecidos profundamente.'
    },
    {
      titulo: 'Dinâmica do Feitiço contra o Feiticeiro',
      objetivo: 'Cuidado e Empatia no Trato',
      tamanhoGrupo: '10 a 20',
      materiaisLista: 'Papeizinhos, canetas',
      instrucoes: 'No papel manda 1 participante criar um "mico" (punitivo ou divertido) BEM DIFICL para a pessoa do lado dele fazer.\nEx: Ficar 2 min num pé só. Quando acabarem de escrever, vem o tombo: O líder manda todos passarem o papel pro lado e fazer o SEU PROPRIO MICO.',
      reflexao: 'Ação e reação. Amai ao próximo... Nunca exija de alguém pesos pesados demais que nem mesmo você consegue carregar (Mateus 23:4).'
    }
  ];

  curadoriaLivros = [
    {
      titulo: 'Mensagem e Cuidado',
      autor: 'Luciano Subirá',
      descricao: 'Princípios profundos sobre como cuidar e zelar por vidas, ajudando a traçar um caminho de pastoreio eficiente.',
      categoria: 'Pastoreio e Cuidado',
      badge: 'Essencial',
      capaUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
      linkCompra: 'https://www.google.com/search?q=livro+mensagem+e+cuidado+luciano+subira+comprar'
    },
    {
      titulo: 'Comunhão',
      autor: 'Dietrich Bonhoeffer',
      descricao: 'Uma obra prima sobre viver em grupo e os desafios de estar em contato constante com o próximo na igreja.',
      categoria: 'Comunhão e Célula',
      capaUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300',
      linkCompra: 'https://www.google.com/search?q=livro+comunhao+dietrich+bonhoeffer+comprar'
    },
    {
      titulo: 'Liderança Com Propósito',
      autor: 'Rick Warren',
      descricao: 'Lições de Neemias para o ministério. Como focar na missão que Deus te comissionou como líder.',
      categoria: 'Liderança',
      badge: 'TOP',
      capaUrl: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=300',
      linkCompra: 'https://www.google.com/search?q=livro+lideranca+com+proposito+rick+warren+comprar'
    },
    {
      titulo: 'O Líder Corajoso',
      autor: 'Dan B. Allender',
      descricao: 'Relutância e coragem no ministério. Aprenda a liderar de forma autêntica lidando com seus próprios medos.',
      categoria: 'Autocuidado',
      capaUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=300',
      linkCompra: 'https://www.google.com/search?q=livro+o+lider+corajoso+dan+b+allender+comprar'
    },
    {
      titulo: 'Não Me Faça Contar Até Três',
      autor: 'Ginger Plowman',
      descricao: 'Muito citado por líderes de jovens para entender disciplina e correção em amor.',
      categoria: 'Jovens',
      capaUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=300',
      linkCompra: 'https://www.google.com/search?q=livro+nao+me+faca+contar+ate+tres+comprar'
    },
    {
      titulo: 'Geração do Quarto',
      autor: 'Hugo Santos',
      descricao: 'Aborda a depressão e isolamento da nova geração (Geração Z) e como a igreja deve lidar com isso e integrá-los.',
      categoria: 'Saúde Mental',
      badge: 'Muito Atual',
      capaUrl: 'https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?auto=format&fit=crop&q=80&w=300',
      linkCompra: 'https://www.google.com/search?q=livro+geracao+do+quarto+comprar'
    }
  ];

  getIcon(tipo: string): string {
    switch(tipo) {
      case 'video': return 'play_circle';
      case 'pdf': return 'picture_as_pdf';
      case 'artigo': return 'article';
      case 'podcast': return 'podcasts';
      default: return 'file_present';
    }
  }

  getBgClass(tipo: string): string {
    switch(tipo) {
      case 'video': return 'bg-rose-400';
      case 'pdf': return 'bg-amber-400';
      case 'artigo': return 'bg-indigo-400';
      case 'podcast': return 'bg-violet-400';
      default: return 'bg-slate-400';
    }
  }

  openPdfModal(url: string, title: string) {
    this.selectedPdfTitle.set(title);
    this.selectedPdfUrl.set(url);
    this.pdfModalOpen.set(true);
  }

  closePdfModal() {
    this.pdfModalOpen.set(false);
    this.selectedPdfUrl.set('');
  }
  
  getSafeUrl(url: string): SafeResourceUrl {
    // If it's a direct PDF, going through Google Docs Viewer might work best for cross-origin iframes
    // Otherwise just bypass security trust.
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  openDinamica(dinamica: any) {
    this.selectedDinamica.set(dinamica);
  }
  
  closeDinamica() {
    this.selectedDinamica.set(null);
  }
  
  openEstudo(estudo: any) {
    this.selectedEstudo.set(estudo);
  }
  
  closeEstudo() {
    this.selectedEstudo.set(null);
  }
}
