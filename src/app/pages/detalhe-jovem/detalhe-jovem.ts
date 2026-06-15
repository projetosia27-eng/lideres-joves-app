import { Component, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, StatusScore } from '../../data.service';
import { ImgbbService } from '../../imgbb.service';

@Component({
  selector: 'app-detalhe-jovem',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule],
  templateUrl: './detalhe-jovem.component.html',
  styleUrls: ['./detalhe-jovem.component.css']
})
export class DetalheJovemComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  data = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  imgbb = inject(ImgbbService);

  jovemId = signal<string>('');
  showDeleteModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  dataNascimentoInput = '';

  get hasImgbbKey(): boolean {
    return !!localStorage.getItem('imgbbKey');
  }

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
    return (j.jornada as unknown as Record<string, boolean>)[etapaId] || false;
  }

  toggleJornada(etapaId: string) {
    const j = this.jovem();
    if (!j) return;
    
    const currentJornada = j.jornada || { visita: false, integracao: false, batismo: false, discipulado: false, servir: false };
    const journeyRecord = currentJornada as unknown as Record<string, boolean>;
    
    const updatedJornada = { ...currentJornada, [etapaId]: !journeyRecord[etapaId] } as unknown as {
      visita: boolean;
      integracao: boolean;
      batismo: boolean;
      discipulado: boolean;
      servir: boolean;
    };
    this.data.updateJovem(j.id, { jornada: updatedJornada });
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
      if (j.dataNascimento) {
        const parts = j.dataNascimento.split('-');
        if (parts.length === 3) {
          this.dataNascimentoInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          this.dataNascimentoInput = '';
        }
      } else {
        this.dataNascimentoInput = '';
      }
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
        this.editJovem.dataNascimento = `${ano}-${mesStr}-${diaStr}`;
        this.calculateAge();
      } else {
        this.editJovem.dataNascimento = '';
      }
    } else {
      this.editJovem.dataNascimento = '';
    }
  }

  onNativeDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value; // Format is YYYY-MM-DD
    if (!value) return;

    this.editJovem.dataNascimento = value;
    this.calculateAge();

    const parts = value.split('-');
    if (parts.length === 3) {
      this.dataNascimentoInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  calculateAge() {
    if (!this.editJovem.dataNascimento) return;
    const birthDate = new Date(this.editJovem.dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    this.editJovem.idade = age;
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

  contarPresencas(): number {
    const j = this.jovem();
    return j?.historicoPresenca?.filter(h => h.presente)?.length || 0;
  }

  obterUltimaPresenca(): Date | null {
    const hist = this.historicoEnriquecido();
    if (hist.length === 0) return null;
    return new Date(hist[0]?.evento?.data);
  }
}
