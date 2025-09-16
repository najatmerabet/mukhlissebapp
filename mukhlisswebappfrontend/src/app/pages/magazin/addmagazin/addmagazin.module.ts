import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MagazineFormComponent } from './addmagazin.component';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: MagazineFormComponent
      }
  ])
]
})
export class AddmagazinModule { }
