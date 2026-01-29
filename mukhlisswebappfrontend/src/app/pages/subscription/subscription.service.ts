import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
    Subscription,
    SubscriptionPayment,
    AppAccessLog,
    SubscriptionStats,
    CreateSubscriptionRequest,
    RenewSubscriptionRequest,
    CreatePaymentRequest
} from './subscription.models';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private apiUrl = 'http://localhost:8000/api';

    constructor(private http: HttpClient) { }

    /**
     * Récupère le token d'authentification
     */
    private getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    }

    /**
     * Crée les headers avec le token d'authentification
     */
    private getHeaders(): HttpHeaders {
        const authToken = this.getAuthToken();
        if (!authToken) {
            console.error('No auth token found');
        }
        return new HttpHeaders({
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        });
    }

    /**
     * Gère les erreurs HTTP
     */
    private handleError(error: any): Observable<never> {
        if (error.status === 401) {
            console.error('Token expired or invalid');
            localStorage.removeItem('authToken');
        }
        console.error('HTTP Error:', error);
        return throwError(() => error);
    }

    // ===== SUBSCRIPTIONS =====

    /**
     * Liste tous les abonnements avec filtres optionnels
     */
    getSubscriptions(filters?: {
        status?: string;
        magasin_id?: string;
        expiring_soon?: boolean;
        search?: string;
        days?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        per_page?: number;
        page?: number;
    }): Observable<any> {
        let params = new HttpParams();

        if (filters) {
            (Object.keys(filters) as Array<keyof typeof filters>).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    params = params.set(key, String(filters[key]));
                }
            });
        }

        return this.http.get(`${this.apiUrl}/subscriptions`, { params, headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Récupère un abonnement par ID
     */
    getSubscription(id: string): Observable<{
        subscription: Subscription;
        recent_logs: AppAccessLog[];
    }> {
        return this.http.get<any>(`${this.apiUrl}/subscriptions/${id}`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Crée un nouvel abonnement
     */
    createSubscription(data: CreateSubscriptionRequest): Observable<{
        message: string;
        subscription: Subscription;
    }> {
        return this.http.post<any>(`${this.apiUrl}/subscriptions`, data, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Met à jour un abonnement
     */
    updateSubscription(id: string, data: Partial<Subscription>): Observable<{
        message: string;
        subscription: Subscription;
    }> {
        return this.http.put<any>(`${this.apiUrl}/subscriptions/${id}`, data, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Supprime un abonnement
     */
    deleteSubscription(id: string): Observable<{ message: string }> {
        return this.http.delete<any>(`${this.apiUrl}/subscriptions/${id}`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Renouvelle un abonnement
     */
    renewSubscription(id: string, data: RenewSubscriptionRequest): Observable<{
        message: string;
        subscription: Subscription;
    }> {
        return this.http.post<any>(`${this.apiUrl}/subscriptions/${id}/renew`, data, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Suspend un abonnement
     */
    suspendSubscription(id: string, reason: string): Observable<{
        message: string;
        subscription: Subscription;
    }> {
        return this.http.post<any>(`${this.apiUrl}/subscriptions/${id}/suspend`, { reason }, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Réactive un abonnement
     */
    activateSubscription(id: string): Observable<{
        message: string;
        subscription: Subscription;
    }> {
        return this.http.post<any>(`${this.apiUrl}/subscriptions/${id}/activate`, {}, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    // ===== PAYMENTS =====

    /**
     * Récupère l'historique des paiements d'un abonnement
     */
    getSubscriptionPayments(subscriptionId: string): Observable<SubscriptionPayment[]> {
        return this.http.get<SubscriptionPayment[]>(`${this.apiUrl}/subscriptions/${subscriptionId}/payments`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Enregistre un nouveau paiement
     */
    createPayment(data: CreatePaymentRequest): Observable<{
        message: string;
        payment: SubscriptionPayment;
    }> {
        return this.http.post<any>(`${this.apiUrl}/subscription-payments`, data, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    // ===== STATISTICS =====

    /**
     * Récupère les statistiques globales
     */
    getStats(): Observable<SubscriptionStats> {
        return this.http.get<SubscriptionStats>(`${this.apiUrl}/subscriptions-stats`, { headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    /**
     * Récupère les abonnements qui expirent bientôt
     */
    getExpiring(days: number = 7): Observable<Subscription[]> {
        return this.http.get<Subscription[]>(`${this.apiUrl}/subscriptions-expiring`, {
            params: { days: days.toString() },
            headers: this.getHeaders()
        }).pipe(catchError(this.handleError.bind(this)));
    }

    // ===== ACCESS LOGS =====

    /**
     * Récupère les logs d'accès
     */
    getAccessLogs(filters?: {
        magasin_id?: string;
        event_type?: string;
        days?: number;
        per_page?: number;
        page?: number;
    }): Observable<any> {
        let params = new HttpParams();

        if (filters) {
            (Object.keys(filters) as Array<keyof typeof filters>).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    params = params.set(key, String(filters[key]));
                }
            });
        }

        return this.http.get(`${this.apiUrl}/access-logs`, { params, headers: this.getHeaders() })
            .pipe(catchError(this.handleError.bind(this)));
    }

    // ===== HELPER METHODS =====

    /**
     * Calcule le nombre de jours restants
     */
    calculateDaysRemaining(endDate: string): number {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Détermine si un abonnement est expiré
     */
    isExpired(endDate: string): boolean {
        return this.calculateDaysRemaining(endDate) < 0;
    }

    /**
     * Détermine si un abonnement expire bientôt
     */
    isExpiringSoon(endDate: string, days: number = 7): boolean {
        const remaining = this.calculateDaysRemaining(endDate);
        return remaining >= 0 && remaining <= days;
    }

    /**
     * Retourne le badge CSS class selon le statut
     */
    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'active':
                return 'badge-success';
            case 'expiring_soon':
                return 'badge-warning';
            case 'expired':
                return 'badge-danger';
            case 'suspended':
                return 'badge-dark';
            case 'inactive':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    }

    /**
     * Retourne le libellé français du statut
     */
    getStatusLabel(status: string): string {
        switch (status) {
            case 'active':
                return 'Actif';
            case 'expiring_soon':
                return 'Expire Bientôt';
            case 'expired':
                return 'Expiré';
            case 'suspended':
                return 'Suspendu';
            case 'inactive':
                return 'Inactif';
            case 'no_subscription':
                return 'Aucun Abonnement';
            default:
                return status;
        }
    }

    /**
     * Retourne le libellé français de la méthode de paiement
     */
    getPaymentMethodLabel(method: string): string {
        switch (method) {
            case 'cash':
                return 'Espèces';
            case 'bank_transfer':
                return 'Virement Bancaire';
            default:
                return method;
        }
    }
    

}
