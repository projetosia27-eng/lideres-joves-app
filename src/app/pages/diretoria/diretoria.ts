import { Component, inject, signal } from '@angular/core';
import { DataService, DiretoriaMember } from '../../data.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-diretoria',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './diretoria.component.html'
})
export class DiretoriaComponent {
  data = inject(DataService);
  showModal = signal(false);
  newMember: Omit<DiretoriaMember, 'id' | 'userId' | 'createdAt'> = {
    nome: '',
    cargo: '',
    fotoUrl: ''
  };

  onJovemSelected(event: any) {
    const selectedJovemId = event.target.value;
    const jovem = this.data.jovens().find(j => j.id === selectedJovemId);
    if (jovem) {
      this.newMember.nome = jovem.nome;
      this.newMember.fotoUrl = jovem.fotoUrl || '';
    }
  }

  openModal() {
    this.showModal.set(true);
    this.newMember = { nome: '', cargo: '', fotoUrl: '' };
  }

  closeModal() {
    this.showModal.set(false);
  }

  save() {
    if (!this.newMember.nome || !this.newMember.cargo) return;
    this.data.addDiretoriaMember(this.newMember);
    this.closeModal();
  }

  deleteMember(id: string) {
    if (!id) {
      console.error('DiretoriaComponent: Delete called with no ID!');
      return;
    }
    this.data.deleteDiretoriaMember(id);
  }
}
