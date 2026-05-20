import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { ImgbbService } from '../../imgbb.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data.service';
import { ThemeService } from '../../theme.service';
import { Router } from '@angular/router';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent implements OnInit {
  imgbb = inject(ImgbbService);

  showImgbbModal = false;
  imgbbKeyInput = '';
  imgbbKeySavedMsg = false;
  installPwa() {
    // Função de placeholder para evitar erro de compilação
    // Implemente a lógica do PWA se necessário
  }

  ngOnInit() {
    // Carrega a chave do imgbb do localStorage se existir
    const key = localStorage.getItem('imgbbKey');
    if (key) this.imgbb.setApiKey(key);
  }

  saveImgbbKey() {
    if (this.imgbbKeyInput.trim().length > 0) {
      localStorage.setItem('imgbbKey', this.imgbbKeyInput.trim());
      this.imgbb.setApiKey(this.imgbbKeyInput.trim());
      this.imgbbKeySavedMsg = true;
      setTimeout(() => {
        this.imgbbKeySavedMsg = false;
        this.showImgbbModal = false;
      }, 1200);
    }
  }
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
  router: Router;

  constructor() {
    this.router = inject(Router);
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

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  async logout() {
    try {
      await signOut(auth);
      this.router.navigate(['/login']);
    } catch {
      alert('Erro ao sair da conta.');
    }
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

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
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
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/png');
          try {
            // Faz upload para o imgbb
            const url = await this.imgbb.uploadImage(base64);
            this.formData.logoUrl = url;
          } catch {
            alert('Erro ao enviar imagem para o imgbb.');
          }
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
