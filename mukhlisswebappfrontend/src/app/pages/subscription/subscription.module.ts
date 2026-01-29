import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { SubscriptionListComponent } from './list/subscription-list.component';
import { SubscriptionDashboardComponent } from './dashboard/subscription-dashboard.component';
import { RenewSubscriptionComponent } from './renew/renew-subscription.component';

// Services
import { SubscriptionService } from './subscription.service';
import { CreatesubscriptionComponent } from './createsubscription/createsubscription.component';

const routes: Routes = [
  {
    path: '',
    component: SubscriptionListComponent
  },
  {
    path: 'dashboard',
    component: SubscriptionDashboardComponent
  },
  {
    path: ':id/renew',
    component: RenewSubscriptionComponent
  },
 {
  path: 'create',
  component: CreatesubscriptionComponent
 }

];

@NgModule({
  declarations: [
    SubscriptionListComponent,
    SubscriptionDashboardComponent,
    RenewSubscriptionComponent ,
    CreatesubscriptionComponent

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    SubscriptionService
  ]
})
export class SubscriptionModule { }
