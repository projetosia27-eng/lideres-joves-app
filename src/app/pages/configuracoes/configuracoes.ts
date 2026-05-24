import { Component, inject, signal, effect } from '@angular/core';
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
export class ConfiguracoesComponent {
  imgbb = inject(ImgbbService);

  installPwa() {
    // Função de placeholder para evitar erro de compilação
    // Implemente a lógica do PWA se necessário
  }

  data = inject(DataService);
  themeService = inject(ThemeService);
  saving = signal(false);
  saved = signal(false);
  simulatedMessage = signal('');
  
  clickCount = 0;
  showSimulator = signal(false);

  logoClick() {
    this.clickCount++;
    if (this.clickCount >= 5) {
      this.showSimulator.set(true);
      this.simulatedMessage.set('Modo do Desenvolvedor ativado! Painel de simulação liberado neste dispositivo.');
      setTimeout(() => this.simulatedMessage.set(''), 4000);
    }
  }

  formData = {
    nome: '',
    endereco: '',
    telefone: '',
    instagram: '',
    logoUrl: null as string | null
  };
  router: Router;

  get subscriptionStatus() {
    const profile = this.data.userProfile();
    if (!profile) {
      return { text: 'Carregando...', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' };
    }

    if (profile.paymentStatus === 'pending') {
      return { text: 'Pendente', class: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 border border-amber-500/20' };
    }

    if (profile.planType === 'expired' || !this.data.isSubscribed()) {
      return { text: 'Expirada', class: 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400 border border-rose-500/20' };
    }

    return { text: 'Ativa', class: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 border border-emerald-500/20' };
  }

  async forceApproved() {
    const email = this.data.userProfile()?.paymentEmail || auth.currentUser?.email || '';
    await this.data.updateSubscription('anual', 'approved', email);
    this.simulatedMessage.set('Simulação de compra concluída! Plano Anual ATIVADO por 365 dias.');
    setTimeout(() => this.simulatedMessage.set(''), 4000);
  }

  async forceExpired() {
    const email = this.data.userProfile()?.paymentEmail || auth.currentUser?.email || '';
    await this.data.updateSubscription('expired', 'none', email);
    this.simulatedMessage.set('Simulação concluída! Seu plano foi marcado como EXPIRADO. A tela de bloqueio foi engajada.');
    setTimeout(() => this.simulatedMessage.set(''), 4000);
  }

  async forceTrial() {
    const email = this.data.userProfile()?.paymentEmail || auth.currentUser?.email || '';
    await this.data.updateSubscription('trial', 'none', email);
    this.simulatedMessage.set('Simulação concluída! Conta revertida para o Período de Testes de 7 dias.');
    setTimeout(() => this.simulatedMessage.set(''), 4000);
  }

  constructor() {
    this.router = inject(Router);
    if (typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('ais-dev-') || window.location.hostname.includes('ais-pre-'))) {
      this.showSimulator.set(true);
    }
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
              const url = await this.imgbb.uploadImage(base64);
              this.formData.logoUrl = url;
          } catch (err: unknown) {
            console.error('Erro ao enviar imagem:', err);
            this.formData.logoUrl = base64; // fallback
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
