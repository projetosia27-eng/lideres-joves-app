import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Evento } from '../../data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [DatePipe, FormsModule, NgClass],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent {
  data = inject(DataService);
  router = inject(Router);
  
  showModal = signal(false);
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
        alert('Não é possível enviar aviso para um evento finalizado.');
        return;
    }
    this.router.navigate(['/jovens'], { queryParams: { avisoEvento: eventoId } });
  }

  isFinished(evento: Evento): boolean {
    return new Date(evento.data) < new Date();
  }
}

