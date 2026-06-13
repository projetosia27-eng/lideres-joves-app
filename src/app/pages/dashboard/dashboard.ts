import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DataService, StatusScore } from '../../data.service';
import { auth } from '../../firebase';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
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
        if (userId) {
          // verify in backend
          this.http.post<{ success: boolean }>('/api/mercado-pago/verify', { paymentId, userId }).subscribe({
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
      }
    });
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
