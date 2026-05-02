import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Transacao } from '../data.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-financeiro',
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-in fade-in duration-500">
      <div class="max-w-6xl mx-auto space-y-8">
        
        <!-- Header -->
        <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
          <div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span class="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <span class="material-symbols-outlined text-[32px]">payments</span>
              </span>
              Financeiro
            </h1>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium">Controle de caixa, entradas e saídas do ministério.</p>
          </div>
          
          <div class="flex items-center gap-3">
            <button (click)="exportFinanceToPDF()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 border border-fuchsia-200 dark:border-fuchsia-500/20">
              <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span class="hidden sm:inline">Exportar PDF</span>
            </button>
            <button (click)="showModal.set(true)" class="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              Nova Transação
            </button>
          </div>
        </header>

        <!-- Cards de Resumo -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
               <span class="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                 <span class="material-symbols-outlined">trending_up</span>
               </span>
               <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Entradas</span>
            </div>
            <div class="text-2xl font-black text-slate-900 dark:text-white">
              {{ data.totalEntradas() | currency:'BRL' }}
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
               <span class="p-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                 <span class="material-symbols-outlined">trending_down</span>
               </span>
               <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Saídas</span>
            </div>
            <div class="text-2xl font-black text-slate-900 dark:text-white">
              {{ data.totalSaidas() | currency:'BRL' }}
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border {{ data.saldoGeral() >= 0 ? 'border-emerald-200 dark:border-emerald-500/20' : 'border-rose-200 dark:border-rose-500/20' }} shadow-md">
            <div class="flex items-center justify-between mb-4">
               <span class="p-2 {{ data.saldoGeral() >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white' }} rounded-xl">
                 <span class="material-symbols-outlined">account_balance_wallet</span>
               </span>
               <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo em Caixa</span>
            </div>
            <div class="text-3xl font-black {{ data.saldoGeral() >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400' }}">
              {{ data.saldoGeral() | currency:'BRL' }}
            </div>
          </div>
        </div>

        <!-- Lista de Transações -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100 dark:border-white/5">
            <h2 class="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">list_alt</span>
              Histórico de Movimentações
            </h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 dark:bg-white/[0.02]">
                  <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                  <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                @for (item of data.transacoes(); track item.id) {
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td class="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                      {{ item.data | date:'dd/MM/yyyy' }}
                    </td>
                    <td class="py-4 px-6 font-bold text-slate-800 dark:text-white text-sm">
                      {{ item.descricao }}
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-lg uppercase">
                        {{ item.categoria || 'Geral' }}
                      </span>
                    </td>
                    <td class="py-4 px-6">
                      <span class="text-[10px] font-black uppercase px-2 py-1 rounded-lg {{ item.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' }}">
                        {{ item.tipo }}
                      </span>
                    </td>
                    <td class="py-4 px-6 text-sm font-black text-right {{ item.tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400' }}">
                      {{ item.tipo === 'saida' ? '-' : '' }}{{ item.valor | currency:'BRL' }}
                    </td>
                    <td class="py-4 px-6 text-right">
                       <button (click)="excluirTransacao(item.id)" class="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all ml-auto">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-20 text-center">
                      <div class="flex flex-col items-center gap-3">
                        <span class="material-symbols-outlined text-slate-200 dark:text-slate-800 text-[64px]">receipt_long</span>
                        <p class="text-slate-400 font-medium">Nenhuma transação registrada.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal Nova Transação -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <h2 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span class="material-symbols-outlined text-indigo-600">add_card</span>
              Nova Transação
            </h2>
            <button (click)="showModal.set(false)" class="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
              <span class="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
          
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Movimentação</label>
              <div class="grid grid-cols-2 gap-3">
                <button (click)="newTransacao.tipo = 'entrada'" 
                        class="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all {{ newTransacao.tipo === 'entrada' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border-slate-100 dark:border-white/5 text-slate-400 hover:border-emerald-200' }}">
                  <span class="material-symbols-outlined">add</span> Entranda
                </button>
                <button (click)="newTransacao.tipo = 'saida'" 
                        class="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all {{ newTransacao.tipo === 'saida' ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'border-slate-100 dark:border-white/5 text-slate-400 hover:border-rose-200' }}">
                  <span class="material-symbols-outlined">remove</span> Saída
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="desc" class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
              <input id="desc" type="text" [(ngModel)]="newTransacao.descricao" class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: Oferta do Culto, Lanche do Evento...">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="valor" class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</label>
                <input id="valor" type="number" [(ngModel)]="newTransacao.valor" class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="0.00">
              </div>
              <div class="space-y-1.5">
                <label for="data" class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                <input id="data" type="date" [(ngModel)]="newTransacao.data" class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all">
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="cat" class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria (Opcional)</label>
              <input id="cat" type="text" [(ngModel)]="newTransacao.categoria" class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: Oferta, Alimentação, Material...">
            </div>
          </div>

          <div class="p-6 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-3">
             <button (click)="showModal.set(false)" class="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">Cancelar</button>
             <button (click)="salvar()" class="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Salvar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class FinanceiroComponent {
  data = inject(DataService);
  
  showModal = signal(false);
  
  newTransacao: Partial<Transacao> = {
    tipo: 'entrada',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: 1,
    categoria: ''
  };

  async salvar() {
    if (!this.newTransacao.descricao || !this.newTransacao.valor || !this.newTransacao.data) return;
    
    await this.data.addTransacao({
      descricao: this.newTransacao.descricao,
      valor: this.newTransacao.valor,
      tipo: this.newTransacao.tipo as 'entrada' | 'saida',
      data: this.newTransacao.data,
      categoria: this.newTransacao.categoria || null
    });

    this.showModal.set(false);
    this.newTransacao = {
      tipo: 'entrada',
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: 1,
      categoria: ''
    };
  }

  async excluirTransacao(id: string) {
    if (confirm('Deseja realmente excluir esta transação?')) {
      await this.data.deleteTransacao(id);
    }
  }

  exportFinanceToPDF() {
    const doc = new jsPDF();
    const transacoes = this.data.transacoes();
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    
    const rows = transacoes.map(t => [
      new Date(t.data).toLocaleDateString('pt-BR'),
      t.descricao,
      t.categoria || 'Geral',
      t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1),
      `R$ ${t.valor.toFixed(2)}`
    ]);

    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Entradas: R$ ${this.data.totalEntradas().toFixed(2)}`, 14, 40);
    doc.text(`Total Saídas: R$ ${this.data.totalSaidas().toFixed(2)}`, 14, 47);
    doc.setFontSize(14);
    doc.text(`Saldo em Caixa: R$ ${this.data.saldoGeral().toFixed(2)}`, 14, 57);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 9 }
    });

    doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
