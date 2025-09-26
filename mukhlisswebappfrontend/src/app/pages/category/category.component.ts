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
  categories: any[] = [];
  searchTerm: string = '';
  filteredCategories: any[] = [];
  
  // Loading and error state properties
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Math reference for template
  math = Math;
  
  // Variables de pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 0;
  pagedCategories: any[] = [];

  constructor(
    private categoryservice: CategoryService, 
    private cdr: ChangeDetectorRef, 
    private router: Router
  ) {}

  ngOnInit() {
    this.LoadCategories();
  }

  // Méthode pour générer les numéros de page à afficher
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Ajuster startPage si endPage est proche de la fin
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Advanced pagination methods for complex pagination display
  getVisiblePages() {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    
    if (totalPages <= 7) {
      return {
        startPages: Array.from({ length: totalPages }, (_, i) => i + 1),
        middlePages: [],
        endPages: []
      };
    }

    const startPages: number[] = [];
    const middlePages: number[] = [];
    const endPages: number[] = [];

    // Always show first page
    if (currentPage > 3) {
      startPages.push(1);
    }

    // Middle pages logic
    if (currentPage <= 3) {
      // Near beginning
      for (let i = 1; i <= Math.min(5, totalPages - 2); i++) {
        middlePages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Near end
      for (let i = Math.max(totalPages - 4, 2); i <= totalPages - 1; i++) {
        middlePages.push(i);
      }
    } else {
      // Middle
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        middlePages.push(i);
      }
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      endPages.push(totalPages);
    }

    return { startPages, middlePages, endPages };
  }

  shouldShowStartEllipsis(): boolean {
    return this.currentPage > 4 && this.totalPages > 7;
  }

  shouldShowEndEllipsis(): boolean {
    return this.currentPage < this.totalPages - 3 && this.totalPages > 7;
  }

  LoadCategories() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.categoryservice.getcategories().subscribe(
      (data) => {
        this.categories = data;
        this.filteredCategories = [...this.categories];
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('Categories loaded:', this.categories);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement des catégories. Veuillez réessayer.';
        this.cdr.detectChanges();
      }
    );
  }

  // Ajoutez cette méthode dans votre classe CategoryComponent
  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredCategories.length);
    return `${start} à ${end}`;
  }

  // Méthode pour mettre à jour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.itemsPerPage);
    
    // S'assurer que la page actuelle est valide
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages > 0 ? this.totalPages : 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedCategories = this.filteredCategories.slice(startIndex, endIndex);
  }

  filterCategories() {
    console.log('Search term:', this.searchTerm);
    console.log('All categories:', this.categories);
    
    if (!this.searchTerm) {
      this.filteredCategories = [...this.categories];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(category => {
        return (
          category.name?.toLowerCase().includes(searchLower) ||
          category.nameFr?.toLowerCase().includes(searchLower) ||
          category.nameAr?.toLowerCase().includes(searchLower) ||
          category.nameEn?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    this.currentPage = 1; // Reset à la première page après filtrage
    this.updatePagination();
    console.log('Filtered results:', this.filteredCategories);
  }

  // Méthodes de pagination
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // Méthode pour changer le nombre d'items par page
  changeItemsPerPage(event: any) {
    this.itemsPerPage = parseInt(event.target.value);
    this.currentPage = 1;
    this.updatePagination();
  }

  deleteCategory(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.categoryservice.deleteCategory(id).subscribe(
        (response) => {
          console.log('Category deleted:', response);
          this.LoadCategories();
        },
        (error) => {
          console.error('Error deleting category:', error);
          this.errorMessage = 'Erreur lors de la suppression de la catégorie.';
        }
      );
    }
  }

  editCategory(id: number) {
    this.router.navigate(['apps/category/edit', id]);
  }

  addCategory() {
    console.log('Navigating to add category page');
    this.router.navigate(['apps/category/add']);
  }
}