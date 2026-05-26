import { Component, inject, signal } from '@angular/core';
import { DataService, DiretoriaMember } from '../../data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-diretoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './diretoria.component.html'
})
export class DiretoriaComponent {
  data = inject(DataService);
  showModal = signal(false);
  isEditing = signal(false);
  editingMemberId = signal('');
  newMember: Omit<DiretoriaMember, 'id' | 'userId' | 'createdAt'> = {
    nome: '',
    cargo: '',
    fotoUrl: ''
  };

  onJovemSelected(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedJovemId = target ? target.value : '';
    const jovem = this.data.jovens().find(j => j.id === selectedJovemId);
    if (jovem) {
      this.newMember.nome = jovem.nome;
      this.newMember.fotoUrl = jovem.fotoUrl || '';
    }
  }

  openModal() {
    this.showModal.set(true);
    this.isEditing.set(false);
    this.editingMemberId.set('');
    this.newMember = { nome: '', cargo: '', fotoUrl: '' };
  }

  editMember(membro: DiretoriaMember) {
    this.isEditing.set(true);
    this.editingMemberId.set(membro.id);
    this.newMember = {
      nome: membro.nome,
      cargo: membro.cargo,
      fotoUrl: membro.fotoUrl || ''
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  save() {
    if (!this.newMember.nome || !this.newMember.cargo) return;
    if (this.isEditing()) {
      this.data.updateDiretoriaMember(this.editingMemberId(), this.newMember);
    } else {
      this.data.addDiretoriaMember(this.newMember);
    }
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
