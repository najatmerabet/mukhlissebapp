import { Component } from '@angular/core';
import { CategoryService } from './category.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent {
categories :any[] = [];
searchTerm: string = '';
filteredCategories: any[] = [];
  constructor(private categoryservice:CategoryService, private cdr: ChangeDetectorRef , private router: Router) {}

  ngOnInit(){
    this.LoadCategories();
    this.cdr.detectChanges();
  }

LoadCategories(){
  this.categoryservice.getcategories().subscribe(
    (data)=>{
      this.categories = data;
      this.filteredCategories = [...this.categories];
      this.cdr.detectChanges();
      console.log('Categories loaded:', this.categories);
    },
    (error)=>{
      console.error('Error fetching categories:', error);
    }
  )
}
deleteCategory(id:number){
  this.categoryservice.deleteCategory(id).subscribe(
    (response)=>{
      console.log('Category deleted:', response);
      this.LoadCategories(); // Refresh the list after deletion
    },
    (error)=>{
      console.error('Error deleting category:', error);
    }
  )
};

editCategory(id:number){
  this.router.navigate(['apps/category/edit', id]);
};

 addCategory(){
  console.log('Navigating to add category page');
  this.router.navigate(['apps/category/add']);
 }

filterCategories() {
  console.log('Search term:', this.searchTerm);
  console.log('All categories:', this.categories);
  
  if (!this.searchTerm) {
    this.filteredCategories = [...this.categories];
    console.log('No search term, showing all:', this.filteredCategories);
    return;
  }

  const searchLower = this.searchTerm.toLowerCase();
  
  this.filteredCategories = this.categories.filter(category => {
    const matches = 
      category.name?.toLowerCase().includes(searchLower) ||
      category.nameFr?.toLowerCase().includes(searchLower) ||
      category.nameAr?.toLowerCase().includes(searchLower) ||
      category.nameEn?.toLowerCase().includes(searchLower);
    
    console.log('Category:', category, 'Matches:', matches);
    return matches;
  });
  
  console.log('Filtered results:', this.filteredCategories);
}
}
