import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Evento } from '../../data.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [DatePipe, FormsModule, NgClass],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnDestroy {
  data = inject(DataService);
  router = inject(Router);
  snackbar = inject(SnackbarService);
  private overdueCheckId: number | null = null;
  
  showModal = signal(false);
  showPresencaModal = signal(false);
  selectedEvento = signal<Evento | null>(null);
  newEvent = { nome: '', data: '' };
  searchQuery = signal('');

  filteredEventos = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.data.eventos();
    
    return this.data.eventos().filter(evento => {
      const dateParts = evento.data.split('-');
      const ptBrDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : evento.data;
      
      return evento.nome.toLowerCase().includes(query) || 
             evento.data.includes(query) ||
             ptBrDate.includes(query);
    });
  });

  openModal() {
    const today = new Date().toISOString().split('T')[0];
    this.newEvent = { nome: '', data: today };
    this.showModal.set(true);
  }

  constructor() {
    // Start periodic check for overdue events that are not finalized
    if (typeof window !== 'undefined') {
      this.overdueCheckId = window.setInterval(() => {
        try {
          const now = new Date();
          const overdue = this.data.eventos().filter(e => !e.realizado && new Date(e.data) < now);
          overdue.forEach(ev => {
            // show a high-priority snackbar with action to finalize
              this.snackbar.show(`Evento "${ev.nome}" passou e precisa ser finalizado.`, 0, 'error', {
              label: 'Finalizar',
              callback: () => this.finalizarEvento(ev.id)
              }, true);

            // play a short beep
            try {
              const AudioCtor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
                ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
              if (AudioCtor) {
                const ctx = new AudioCtor();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = 880;
                g.gain.value = 0.03;
                o.connect(g);
                g.connect(ctx.destination);
                o.start();
                setTimeout(() => { o.stop(); try { ctx.close(); } catch { /* ignore */ } }, 180);
              }
            } catch {
              // ignore audio errors
            }
          });
        } catch {
          // ignore
        }
      }, 7000);
    }
  }

    ngOnDestroy(): void {
      if (this.overdueCheckId) {
        clearInterval(this.overdueCheckId);
        this.overdueCheckId = null;
      }
    }

  closeModal() {
    this.showModal.set(false);
  }

  saveEvento() {
    if (this.newEvent.nome && this.newEvent.data) {
      this.data.addEvento(this.newEvent.nome, this.newEvent.data);
      this.closeModal();
    }
  }

  enviarAviso(eventoId: string) {
    const evento = this.data.eventos().find(e => e.id === eventoId);
    if (!evento || evento.realizado || this.isFinished(evento)) {
      this.snackbar.show('Não é possível enviar aviso para um evento finalizado.');
        return;
    }
    this.router.navigate(['/jovens'], { queryParams: { avisoEvento: eventoId } });
  }

  abrirRelatorioPresenca(eventoId: string) {
    const evento = this.data.eventos().find(e => e.id === eventoId);
    if (evento) {
      this.selectedEvento.set(evento);
      this.showPresencaModal.set(true);
    }
  }

  async finalizarEvento(eventoId: string) {
    try {
      await this.data.finalizarEvento(eventoId);
      const evento = this.data.eventos().find(e => e.id === eventoId);
      // If event is within 2 days from now, offer undo
      if (evento) {
        const eventDate = new Date(evento.data);
        const now = new Date();
        const diff = now.getTime() - eventDate.getTime();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        if (diff <= twoDaysMs) {
          this.snackbar.show('Evento finalizado.', 5000, 'success', {
              label: 'Desfazer',
            callback: async () => {
              try {
                await this.data.unfinalizarEvento(eventoId);
                this.snackbar.show('Finalização desfeita.', 3000, 'success');
              } catch (error) {
                console.error(error);
                this.snackbar.show('Erro ao desfazer finalização.', 4000, 'error');
              }
            }
          }, true);
        } else {
          this.snackbar.show('Evento finalizado.', 3000, 'success');
        }
      } else {
        this.snackbar.show('Evento finalizado.', 3000, 'success');
      }
      if (this.selectedEvento() && this.selectedEvento()!.id === eventoId) {
        this.showPresencaModal.set(false);
      }
    } catch (error) {
      console.error(error);
      this.snackbar.show('Erro ao finalizar evento.', 4000, 'error');
    }
  }

  async deletarEvento(eventoId: string) {
    const confirmDelete = window.confirm('Deseja realmente excluir este evento? Esta ação não pode ser desfeita.');
    if (!confirmDelete) {
      return;
    }
    try {
      await this.data.deleteEvento(eventoId);
      this.snackbar.show('Evento excluído com sucesso.', 3000, 'success');
      if (this.selectedEvento() && this.selectedEvento()!.id === eventoId) {
        this.showPresencaModal.set(false);
      }
    } catch (error) {
      console.error(error);
      this.snackbar.show('Erro ao excluir evento.', 4000, 'error');
    }
  }

  getPresencasEvento(eventoId: string) {
    const jovens = this.data.jovens();
    return jovens.filter(j => 
      j.historicoPresenca?.some(h => h.eventoId === eventoId && h.presente)
    ).map(j => ({
      nome: j.nome,
      fotoUrl: j.fotoUrl,
      telefone: j.telefone
    }));
  }

  getAusenciasEvento(eventoId: string) {
    const jovens = this.data.jovens();
    return jovens.filter(j => 
      j.historicoPresenca?.some(h => h.eventoId === eventoId && !h.presente)
    ).map(j => ({
      nome: j.nome,
      fotoUrl: j.fotoUrl,
      telefone: j.telefone
    }));
  }

  isFinished(evento: Evento): boolean {
    return new Date(evento.data) < new Date();
  }
}

