import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Transacao } from '../../data.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-financeiro',
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.css'],
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
