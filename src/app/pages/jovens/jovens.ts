import { Component, inject, signal, computed, ChangeDetectorRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DataService, StatusScore } from '../../data.service';
import { ImgbbService } from '../../imgbb.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-jovens',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './jovens.component.html',
  styleUrls: ['./jovens.component.css']
})
export class JovensComponent implements OnInit {
  data = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  route = inject(ActivatedRoute);
  imgbb = inject(ImgbbService);
  showModal = signal(false);
  showMessageModal = signal(false);
  jovemToDelete = signal<string | null>(null);
  selectedJovens = signal<Set<string>>(new Set());
  filterType = signal<'todos' | 'novos' | 'aniversariantes'>('todos');
  messageTemplate = signal('Olá {nome}! Teremos um evento especial neste sábado. Contamos com você!');
  dataNascimentoInput = '';
  
  get hasImgbbKey(): boolean {
    return !!localStorage.getItem('imgbbKey');
  }

  toggleSelection(id: string) {
    const next = new Set(this.selectedJovens());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedJovens.set(next);
  }

  toggleSelectAll() {
    if (this.selectedJovens().size === this.data.jovens().length) {
      this.selectedJovens.set(new Set());
    } else {
      this.selectedJovens.set(new Set(this.data.jovens().map(j => j.id)));
    }
  }
  
  sendMessageToSelected() {
    const selected = this.data.jovens().filter(j => this.selectedJovens().has(j.id));
    for (const j of selected) {
       if (j.telefone) {
         window.open(this.getWhatsAppLink(j.telefone, j.nome), '_blank');
       }
    }
  }

  newJovem = {
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

  get contactsSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'contacts' in navigator;
  }

  async importContact() {
    if (!this.contactsSupported) {
      alert('A importação de contatos não é suportada neste navegador ou dispositivo.');
      return;
    }

    try {
      // Abre o seletor nativo de contatos solicitando o nome e o telefone
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      
      const nav = navigator as unknown as { 
        contacts: { 
          select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]> 
        } 
      };
      
      const contacts = await nav.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        // Nome completo
        if (contact.name && contact.name.length > 0) {
          this.newJovem.nome = contact.name[0];
        }
        // Telefone formatado
        if (contact.tel && contact.tel.length > 0) {
          const rawPhone = contact.tel[0];
          // Limpa caracteres especiais, mantendo os números e o sinal + do DDI se houver
          this.newJovem.telefone = rawPhone.replace(/[^\d+]/g, '');
        }
        this.cdr.detectChanges();
      }
    } catch (err: unknown) {
      console.error('Erro ao importar contato:', err);
      const errorWithName = err as { name?: string; message?: string };
      // O AbortError acontece caso o usuário feche a lista de contatos nativa sem selecionar
      if (errorWithName?.name !== 'AbortError') {
        alert('Erro ao carregar contato do celular: ' + (errorWithName?.message || 'Erro desconhecido'));
      }
    }
  }

  filteredJovens = computed(() => {
    if (this.filterType() === 'novos') {
      return this.data.jovens().filter(j => j.novoConvertido);
    }
    if (this.filterType() === 'aniversariantes') {
      return this.data.aniversariantes();
    }
    return this.data.jovens();
  });

  calculateAge() {
    if (!this.newJovem.dataNascimento) return;
    const birthDate = new Date(this.newJovem.dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    this.newJovem.idade = age;
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const filter = params['filter'];
      if (filter === 'aniversariantes') {
        this.filterType.set('aniversariantes');
      }

      const eventoId = params['avisoEvento'];
      if (eventoId) {
        this.showMessageModal.set(true);
        // Wait a tick for modal to render and select to exist
        setTimeout(() => {
          const select = document.getElementById('eventSelect') as HTMLSelectElement;
          if (select) {
            select.value = eventoId;
            // dispatch change event to run the selecting logic
            select.dispatchEvent(new Event('change'));
          } else {
             // Fallback if select doesn't exist yet but data does
             const evento = this.data.eventos().find(e => e.id === eventoId);
             if (evento) {
                const parts = evento.data.split('-');
                const dataStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : evento.data;
                this.messageTemplate.set(`Olá {nome}! Teremos o evento "${evento.nome}" no dia ${dataStr}. Contamos com você!`);
             }
          }
        }, 100);
      }
    });
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
          const base64 = canvas.toDataURL('image/jpeg', 0.85);

          const key = localStorage.getItem('imgbbKey');
          if (key) {
            this.imgbb.uploadImage(base64).then(url => {
              targetObj.fotoUrl = url;
              this.cdr.detectChanges();
            }).catch(err => {
              console.error(err);
              targetObj.fotoUrl = base64;
              this.cdr.detectChanges();
            });
          } else {
            targetObj.fotoUrl = base64;
            this.cdr.detectChanges();
          }
        }
      };
      img.onerror = () => {
         alert('Erro ao carregar a imagem. Verifique se o arquivo não está corrompido e tente novamente (formatos ideais: JPG, PNG).');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) {
        formatted += '/' + value.substring(2, 4);
      }
      if (value.length > 4) {
        formatted += '/' + value.substring(4, 8);
      }
    }
    input.value = formatted;
    this.dataNascimentoInput = formatted;

    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const dia = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10);
      const ano = parseInt(parts[2], 10);
      
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900 && ano <= 2100) {
        const mesStr = String(mes).padStart(2, '0');
        const diaStr = String(dia).padStart(2, '0');
        this.newJovem.dataNascimento = `${ano}-${mesStr}-${diaStr}`;
        this.calculateAge();
      } else {
        this.newJovem.dataNascimento = '';
      }
    } else {
      this.newJovem.dataNascimento = '';
    }
  }

  onNativeDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value; // Format is YYYY-MM-DD
    if (!value) return;

    this.newJovem.dataNascimento = value;
    this.calculateAge();

    const parts = value.split('-');
    if (parts.length === 3) {
      this.dataNascimentoInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
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

  openModal() {
    this.showModal.set(true);
    this.dataNascimentoInput = '';
    this.newJovem = { nome: '', idade: 18, dataNascimento: '', tamanhoChinelo: '', tamanhoRoupa: '', telefone: '', fotoUrl: '', score: 'verde', novoConvertido: false };
  }

  openMessageModal() {
    this.showMessageModal.set(true);
  }

  selecionarEventoParaMensagem(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select.value) return;
    const evento = this.data.eventos().find(e => e.id === select.value);
    if (evento) {
      // Create a nice message
      const parts = evento.data.split('-');
      const dataStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : evento.data;
      this.messageTemplate.set(`Olá {nome}! Teremos o evento "${evento.nome}" no dia ${dataStr}. Contamos com você!`);
      // Reset select
      select.value = '';
    }
  }

  getWhatsAppLink(telefone: string | null, nome: string): string {
    if (!telefone) return '#';
    let num = telefone.replace(/\D/g, '');
    if (num.length === 10 || num.length === 11) {
      num = '55' + num;
    }
    const msg = this.messageTemplate().replace('{nome}', nome.split(' ')[0]);
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveJovem() {
    if (!this.newJovem.nome) return;
    this.data.addJovem(this.newJovem);
    this.closeModal();
  }

  deletarJovem(id: string) {
    this.jovemToDelete.set(id);
  }

  confirmDelete() {
    const id = this.jovemToDelete();
    if (id) {
      this.data.deleteJovem(id);
      this.jovemToDelete.set(null);
    }
  }

  exportBirthdaysToPDF() {
    const doc = new jsPDF();
    const data = this.data.aniversariantes();
    const headers = ['Nome', 'Data Nasc.', 'Dia', 'Telefone'];
    
    const rows = data.map(j => [
      j.nome,
      j.dataNascimento ? new Date(j.dataNascimento).toLocaleDateString('pt-BR') : '--',
      this.data.getAniversarioDia(j.dataNascimento),
      j.telefone || '--'
    ]);

    const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
    const titulo = `Aniversariantes de ${mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}`;

    doc.setFontSize(18);
    doc.text(titulo, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Lista gerada em ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 9 }
    });

    doc.save(`aniversariantes_${mesAtual}.pdf`);
  }

  cancelDelete() {
    this.jovemToDelete.set(null);
  }
}
