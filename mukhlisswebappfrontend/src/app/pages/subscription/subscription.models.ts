export interface Subscription {
    id: string;
    magasin_id: string;
    magasin_name: string;
    contact_phone: string;
    contact_email: string;
    is_active: boolean;
    status: 'active' | 'expired' | 'suspended' | 'inactive';
    start_date: string;
    end_date: string;
    payment_method?: 'cash' | 'bank_transfer';
    last_payment_date?: string;
    last_payment_amount?: number;
    payment_reference?: string;
    admin_notes?: string;
    suspension_reason?: string;
    plan_type?: string;
    plan_price?: number;
    created_at: string;
    updated_at: string;
    created_by?: string;

    // Relations
    magazin?: any;
    creator?: any;
    payments?: SubscriptionPayment[];

    // Computed
    days_remaining?: number;
    is_expired?: boolean;
    is_expiring_soon?: boolean;
}

export interface SubscriptionPayment {
    id: string;
    magasin_id: string;
    subscription_id: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer';
    payment_date: string;
    payment_reference?: string;
    period_start: string;
    period_end: string;
    notes?: string;
    recorded_by?: string;
    recorded_at: string;

    // Relations
    magazin?: any;
    subscription?: Subscription;
    recorder?: any;
}

export interface AppAccessLog {
    id: string;
    magasin_id: string;
    event_type: 'access_granted' | 'access_denied' | 'access_error' | 'app_opened';
    user_id?: string;
    user_email?: string;
    device_info?: string;
    app_version?: string;
    denial_reason?: string;
    created_at: string;

    // Relations
    magazin?: any;
}

export interface SubscriptionStats {
    total: number;
    active: number;
    expiring_soon: number;
    expired: number;
    suspended: number;
    monthly_revenue: number;
    yearly_revenue: number;
    monthly_revenue_chart: Array<{
        month: string;
        revenue: number;
    }>;
}

export interface CreateSubscriptionRequest {
    magasin_id: string;
    start_date: string;
    end_date: string;
    plan_type?: string;
    plan_price?: number;
    payment_method?: 'cash' | 'bank_transfer';
    contact_phone?: string;
    contact_email?: string;
    admin_notes?: string;
}

export interface RenewSubscriptionRequest {
    months: number;
    payment_amount: number;
    payment_method: 'cash' | 'bank_transfer';
    payment_date: string;
    payment_reference?: string;
    notes?: string;
}

export interface CreatePaymentRequest {
    magasin_id: string;
    subscription_id: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer';
    payment_date: string;
    payment_reference?: string;
    period_start: string;
    period_end: string;
    notes?: string;
}
