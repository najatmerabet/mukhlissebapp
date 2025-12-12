import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../subscription.service';
import { Subscription } from '../subscription.models';

@Component({
    selector: 'app-subscription-list',
    templateUrl: './subscription-list.component.html',
    styleUrls: ['./subscription-list.component.scss']
})
export class SubscriptionListComponent implements OnInit {
    // Make Math available in the template
    protected Math = Math;
    
    subscriptions: Subscription[] = [];
    loading = false;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    totalPages = 1;
    perPage = 15;
    total = 0;

    // Filtres
    filters = {
        status: '',
        search: '',
        expiring_soon: false,
        sort_by: 'created_at',
        sort_order: 'desc' as 'asc' | 'desc'
    };

    // Options pour les filtres
    statusOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'active', label: 'Actif' },
        { value: 'expiring_soon', label: 'Expire Bientôt' },
        { value: 'expired', label: 'Expiré' },
        { value: 'suspended', label: 'Suspendu' },
        { value: 'inactive', label: 'Inactif' }
    ];

    constructor(
        private subscriptionService: SubscriptionService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadSubscriptions();
    }

    loadSubscriptions(): void {
        this.loading = true;
        this.error = null;

        const params = {
            ...this.filters,
            page: this.currentPage,
            per_page: this.perPage
        };

        console.log('Loading subscriptions with params:', params);

        this.subscriptionService.getSubscriptions(params).subscribe({
            next: (response) => {
                console.log('Subscriptions response:', response);
                this.subscriptions = response.data;
                this.currentPage = response.current_page;
                this.totalPages = response.last_page;
                this.total = response.total;
                this.loading = false;
                console.log('Loaded subscriptions:', this.subscriptions);
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading subscriptions:', err);
                this.error = 'Erreur lors du chargement des abonnements';
                console.error(err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadSubscriptions();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadSubscriptions();
    }

    viewDetails(subscription: Subscription): void {
        this.router.navigate(['/subscriptions', subscription.id]);
    }

    editSubscription(subscription: Subscription): void {
        this.router.navigate(['/subscriptions', subscription.id, 'edit']);
    }

    renewSubscription(subscription: Subscription): void {
        this.router.navigate(['/apps/subscriptions', subscription.id, 'renew']);
    }

    suspendSubscription(subscription: Subscription): void {
        if (confirm(`Êtes-vous sûr de vouloir suspendre l'abonnement de ${subscription.magasin_name}?`)) {
            const reason = prompt('Raison de la suspension:');
            if (reason) {
                this.subscriptionService.suspendSubscription(subscription.id, reason).subscribe({
                    next: () => {
                        this.loadSubscriptions();
                    },
                    error: (err) => {
                        alert('Erreur lors de la suspension');
                        console.error(err);
                    }
                });
            }
        }
    }

    activateSubscription(subscription: Subscription): void {
        if (confirm(`Êtes-vous sûr de vouloir réactiver l'abonnement de ${subscription.magasin_name}?`)) {
            this.subscriptionService.activateSubscription(subscription.id).subscribe({
                next: () => {
                    this.loadSubscriptions();
                },
                error: (err) => {
                    alert('Erreur lors de la réactivation');
                    console.error(err);
                }
            });
        }
    }

    deleteSubscription(subscription: Subscription): void {
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'abonnement de ${subscription.magasin_name}? Cette action est irréversible.`)) {
            this.subscriptionService.deleteSubscription(subscription.id).subscribe({
                next: () => {
                    this.loadSubscriptions();
                },
                error: (err) => {
                    alert('Erreur lors de la suppression');
                    console.error(err);
                }
            });
        }
    }

    createNew(): void {
        this.router.navigate(['/subscriptions/create']);
    }

    getDaysRemaining(endDate: string): number {
        return this.subscriptionService.calculateDaysRemaining(endDate);
    }

    getStatusBadgeClass(status: string): string {
        return this.subscriptionService.getStatusBadgeClass(status);
    }

    getStatusLabel(status: string): string {
        return this.subscriptionService.getStatusLabel(status);
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('fr-FR');
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
}
