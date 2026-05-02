import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 h-full overflow-y-auto pb-10 pr-2">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <span class="material-symbols-outlined text-2xl">church</span>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Configurações da Igreja</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm">Gerencie os dados do seu ministério e informações para relatórios.</p>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div class="p-6 sm:p-8 space-y-8">
          
          <!-- Seção de Logo -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-slate-100 dark:border-slate-700">
             <div class="relative group cursor-pointer" (click)="fileInput.click()">
               @if (formData.logoUrl) {
                 <img [src]="formData.logoUrl" alt="Logo da Igreja" class="w-24 h-24 object-cover rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
               } @else {
                 <div class="w-24 h-24 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">
                    <span class="material-symbols-outlined text-3xl mb-1">add_photo_alternate</span>
                    <span class="text-[10px] font-medium tracking-wide uppercase">Adicionar</span>
                 </div>
               }
               
               <div class="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <span class="material-symbols-outlined text-white">edit</span>
               </div>
               <input type="file" #fileInput class="hidden" accept="image/*" (change)="onFileSelected($event)">
             </div>
             <div>
               <h3 class="text-base font-bold text-slate-800 dark:text-white mb-1">Logo do Ministério</h3>
               <p class="text-sm text-slate-500 dark:text-slate-400">Recomendado: Imagem quadrada em formato PNG ou JPG (max 1MB).</p>
               @if (formData.logoUrl) {
                 <button (click)="formData.logoUrl = null" class="mt-3 text-sm text-red-500 font-medium hover:text-red-600 transition-colors">Remover logo</button>
               }
             </div>
          </div>

          <!-- Seção de Tema -->
          <div class="py-10 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 class="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500">contrast</span>
                Aparência
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Personalize o visual do aplicativo entre os modos claro e escuro.</p>
            </div>
            <button (click)="themeService.toggleTheme()" 
                    class="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 shadow-sm group">
              <span class="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform {{ themeService.isDark() ? 'text-amber-500' : 'text-indigo-600' }}">
                {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
              </span>
              <span class="font-bold uppercase tracking-widest text-xs">Ativar Modo {{ themeService.isDark() ? 'Claro' : 'Escuro' }}</span>
            </button>
          </div>

          <!-- Formulário -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5 md:col-span-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome da Igreja / Ministério</label>
              <input type="text" [(ngModel)]="formData.nome" placeholder="Ex: Ministério Jovem IBC" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white">
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Endereço Completo</label>
              <input type="text" [(ngModel)]="formData.endereco" placeholder="Rua, Número, Bairro, Cidade" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white">
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
              <input type="text" [(ngModel)]="formData.telefone" placeholder="(00) 00000-0000" class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white">
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Instagram</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">&#64;</span>
                <input type="text" [(ngModel)]="formData.instagram" placeholder="jovens.ibc" class="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white">
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 sm:px-8 sm:py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-xs text-slate-500 dark:text-slate-400 w-full sm:w-auto text-center sm:text-left">
            @if (saving()) {
              Salvando...
            } @else if (saved()) {
              <span class="text-emerald-500 font-medium flex items-center justify-center sm:justify-start gap-1"><span class="material-symbols-outlined text-[16px]">check_circle</span> Configurações salvas!</span>
            } @else {
              As informações serão usadas no cabeçalho dos relatórios.
            }
          </p>
          <button (click)="saveParams()" [disabled]="saving() || !isValid()" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            @if (saving()) {
              <span class="material-symbols-outlined animate-spin">refresh</span>
            } @else {
              <span class="material-symbols-outlined text-[20px]">save</span>
            }
            Salvar Dados
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfiguracoesComponent {
  data = inject(DataService);
  themeService = inject(ThemeService);
  
  saving = signal(false);
  saved = signal(false);

  formData = {
    nome: '',
    endereco: '',
    telefone: '',
    instagram: '',
    logoUrl: null as string | null
  };

  constructor() {
    effect(() => {
      const igreja = this.data.igreja();
      if (igreja) {
        this.formData = {
          nome: igreja.nome,
          endereco: igreja.endereco,
          telefone: igreja.telefone,
          instagram: igreja.instagram,
          logoUrl: igreja.logoUrl || null
        };
      }
    });
  }

  isValid() {
    return this.formData.nome.trim().length > 0;
  }

  async saveParams() {
    if (!this.isValid()) return;
    
    this.saving.set(true);
    this.saved.set(false);
    
    try {
      await this.data.saveIgreja(this.formData);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch(e) {
      console.error(e);
      alert('Erro ao salvar as configurações.');
    } finally {
      this.saving.set(false);
    }
  }

  onFileSelected(event: Event) {
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
          // Keep transparency for PNG where possible or fill with white?
          // Since it might be a logo, let's keep transparency for PNG, use webp.
          // Or just drawing without fillRect keeps transparency.
          // But canvas is implicitly transparent black. DrawImage works correctly with transparent PNG.
          ctx.drawImage(img, 0, 0, width, height);
          this.formData.logoUrl = canvas.toDataURL('image/png'); // Using PNG to preserve logo transparency
        }
      };
      img.onerror = () => {
         alert('Erro ao carregar a imagem. Verifique se o arquivo não está corrompido e tente novamente.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}
