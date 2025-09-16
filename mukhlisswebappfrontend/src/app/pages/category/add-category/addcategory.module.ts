import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddCategoryComponent } from './add-category.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
@NgModule({
  declarations: [AddCategoryComponent],
  imports: [
    CommonModule,
     MatFormFieldModule,
     MatCardModule,
    ReactiveFormsModule ,
    RouterModule.forChild([
      { path: '', component: AddCategoryComponent }
    ])
  ]
})
export class AddCategoryModule { }
