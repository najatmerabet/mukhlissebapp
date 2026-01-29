import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../subscription.service';
import { SubscriptionStats, Subscription } from '../subscription.models';

@Component({
  selector: 'app-subscription-dashboard',
  templateUrl: './subscription-dashboard.component.html',
  styleUrls: ['./subscription-dashboard.component.scss']
})
export class SubscriptionDashboardComponent implements OnInit {
  stats: SubscriptionStats | null = null;
  expiringSubscriptions: Subscription[] = [];
  loading = false;
  error: string | null = null;

  // Chart data
  chartLabels: string[] = [];
  chartData: number[] = [];

  // Expose Math to template
  Math = Math;

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadExpiringSubscriptions();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.subscriptionService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.prepareChartData(stats);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des statistiques';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadExpiringSubscriptions(): void {
    this.subscriptionService.getExpiring(7).subscribe({
      next: (subscriptions) => {
        this.expiringSubscriptions = subscriptions;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement abonnements expirant:', err);
        this.cdr.detectChanges();
      }
    });
  }

  prepareChartData(stats: SubscriptionStats): void {
    this.chartLabels = stats.monthly_revenue_chart.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { 
        month: 'short', 
        year: 'numeric' 
      });
    });
    this.chartData = stats.monthly_revenue_chart.map(item => item.revenue);
  }

  viewSubscription(subscription: Subscription): void {
    this.router.navigate(['/subscriptions', subscription.id]);
  }

  viewAllSubscriptions(): void {
    this.router.navigate(['/subscriptions']);
  }

  viewExpiring(): void {
    this.router.navigate(['/subscriptions'], { 
      queryParams: { expiring_soon: true } 
    });
  }

createNew(): void {
  console.log('Route actuelle:', this.router.url);
  console.log('Chemin relatif:', this.route.snapshot.routeConfig?.path);
   this.router.navigate(['/apps/subscriptions/create']);
  
  // OPTION 2 : Navigation avec log pour debug
  
}

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getDaysRemaining(endDate: string): number {
    return this.subscriptionService.calculateDaysRemaining(endDate);
  }

  getActivePercentage(): number {
    if (!this.stats || this.stats.total === 0) return 0;
    return Math.round((this.stats.active / this.stats.total) * 100);
  }

  getExpiringPercentage(): number {
    if (!this.stats || this.stats.total === 0) return 0;
    return Math.round((this.stats.expiring_soon / this.stats.total) * 100);
  }

  getExpiredPercentage(): number {
    if (!this.stats || this.stats.total === 0) return 0;
    return Math.round((this.stats.expired / this.stats.total) * 100);
  }

  getMaxRevenue(): number {
    if (this.chartData.length === 0) return 1;
    return Math.max(...this.chartData);
  }

  getRevenuePercentage(revenue: number): number {
    const max = this.getMaxRevenue();
    return max > 0 ? (revenue / max) * 100 : 0;
  }
}
