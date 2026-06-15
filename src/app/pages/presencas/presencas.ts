import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { DataService, Evento } from '../../data.service';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-presencas',
  standalone: true,
  imports: [DatePipe, FormsModule, NgClass],
  templateUrl: './presencas.component.html',
  styleUrls: ['./presencas.component.css']
})
export class PresencasComponent {
  data = inject(DataService);
  snackbar = inject(SnackbarService);
  
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
      this.snackbar.show('Presenças atualizadas com sucesso!');
    }
  }
}
