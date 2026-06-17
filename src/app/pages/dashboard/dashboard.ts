import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { DataService, StatusScore, Evento } from '../../data.service';
import { auth } from '../../firebase';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  data = inject(DataService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  http = inject(HttpClient);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const pagamento = params['pagamento'];
      const paymentId = params['payment_id'];
      const status = params['status'];
      
      if (pagamento === 'sucesso' && paymentId && status === 'approved') {
        const userId = this.data.userProfile()?.id || auth.currentUser?.uid;

        // If userId is not available on client, call verify with paymentId only.
        // The server `verify` will attempt to read metadata.user_id from Mercado Pago.
        const body: { paymentId: string; userId?: string } = { paymentId };
        if (userId) body.userId = userId;

        this.http.post<{ success: boolean }>('/api/mercado-pago/verify', body).subscribe({
          next: (res) => {
            if (res.success) {
              // Successfully verified
              // Remove query parameters to avoid re-triggering
              this.router.navigate([], { queryParams: {}, replaceUrl: true });
            }
          },
          error: err => {
            console.error('Error verifying payment:', err);
          }
        });
      }
    });
  }

  // Próximo evento agendado (não finalizado) — o mais próximo no futuro
  nextEvento = computed((): Evento | null => {
    const now = new Date();
    const futuros = this.data.eventos().filter(e => !e.realizado && new Date(e.data) >= now);
    if (!futuros || futuros.length === 0) return null;
    futuros.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    return futuros[0] || null;
  });

  daysUntil(evento: Evento | null): number | null {
    if (!evento) return null;
    const now = new Date();
    const ed = new Date(evento.data);
    const diff = ed.getTime() - now.getTime();
    return diff < 0 ? 0 : Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getBadgeClass(score: StatusScore): string {
    switch (score) {
      case 'verde': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'amarelo': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'vermelho': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  }
}
