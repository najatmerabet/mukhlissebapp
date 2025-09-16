import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ViewdetailsComponent } from './viewdetails.component';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
     RouterModule.forChild([
       { path: '',
         component: ViewdetailsComponent }
     ])
  ]
})
export class ViewdetailsModule { }
