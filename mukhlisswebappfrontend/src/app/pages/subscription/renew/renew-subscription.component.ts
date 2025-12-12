import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubscriptionService } from '../subscription.service';
import { Subscription } from '../subscription.models';

@Component({
  selector: 'app-renew-subscription',
  templateUrl: './renew-subscription.component.html',
  styleUrls: ['./renew-subscription.component.scss']
})
export class RenewSubscriptionComponent implements OnInit {
  renewForm: FormGroup;
  subscription: Subscription | null = null;
  loading = false;
  error: string | null = null;
  subscriptionId: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private cdr: ChangeDetectorRef
  ) {
    this.renewForm = this.fb.group({
      months: [1, [Validators.required, Validators.min(1), Validators.max(24)]],
      payment_amount: [0, [Validators.required, Validators.min(0)]],
      payment_method: ['cash', Validators.required],
      payment_date: [new Date().toISOString().split('T')[0], Validators.required],
      payment_reference: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.subscriptionId = this.route.snapshot.paramMap.get('id') || '';
    console.log('Renew - Subscription ID:', this.subscriptionId);
    this.loadSubscription();
  }

  loadSubscription(): void {
    this.loading = true;
    console.log('Loading subscription for renewal...');
    
    this.subscriptionService.getSubscription(this.subscriptionId).subscribe({
      next: (response) => {
        console.log('Subscription loaded:', response);
        this.subscription = response.subscription;
        
        // Calculer le prix suggéré basé sur le plan
        const planPrice = parseFloat(String(this.subscription.plan_price || '0'));
        console.log('Plan price:', planPrice);
        
        if (planPrice > 0) {
          this.renewForm.patchValue({
            payment_amount: planPrice
          });
        }
        
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Loading finished, form ready');
      },
      error: (err) => {
        console.error('Error loading subscription:', err);
        this.error = 'Erreur lors du chargement de l\'abonnement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onMonthsChange(): void {
    if (this.subscription?.plan_price) {
      const months = this.renewForm.get('months')?.value || 1;
      const totalAmount = this.subscription.plan_price * months;
      this.renewForm.patchValue({
        payment_amount: totalAmount
      });
    }
  }

  onSubmit(): void {
    if (this.renewForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.subscriptionService.renewSubscription(this.subscriptionId, this.renewForm.value).subscribe({
      next: () => {
        alert('Abonnement renouvelé avec succès!');
        this.router.navigate(['/apps/subscriptions']);
      },
      error: (err) => {
        this.error = 'Erreur lors du renouvellement';
        console.error(err);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/apps/subscriptions']);
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
