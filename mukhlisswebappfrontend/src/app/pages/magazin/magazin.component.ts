import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MagazinService } from './magazin.service';
import { ChangeDetectorRef } from '@angular/core';
import { CategoryService } from '../category/category.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-magazin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './magazin.component.html',
  styleUrls: ['./magazin.component.scss']
})
export class MagazinComponent implements OnInit {
  magazins: any[] = [];
  filteredMagazins: any[] = [];
  searchQuery: string = '';
  selectedCategory: string = '';
  categories: any[]=[];
  isLoading: boolean = true;
  errorMessage: string = '';
  currentPage: number = 1;
itemsPerPage: number = 5;  // Modifiable selon ton besoin
totalPages: number = 1;

  constructor(private magazinService: MagazinService, private cdr: ChangeDetectorRef , private categoryService: CategoryService , private router: Router) {}

  ngOnInit() {
    console.log('🔄 ngOnInit called - Starting to load magazins');
    this.loadMagazins();
    this.loadCategories();
  }
loadCategories(){
    this.categoryService.getcategories().subscribe({
      next: (response) => {
        if (!response || !Array.isArray(response)) {
          console.error('Invalid response format for categories:', response);
          this.categories = [];
          return;
        }
        console.log('Categories loaded:', response);
        this.categories = response.map(category => ({
          id: category.id,
          name: category.nameFr
        }));
        this.cdr.detectChanges();
        console.log('categories affected', this.categories);
      },
      
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
      }
    });
  }

  loadMagazins() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.magazinService.getmagazins().subscribe({
        next: (response) => {
            // Vérification plus stricte de la réponse
            if (!response) {
                this.errorMessage = 'Réponse vide du serveur';
                this.magazins = [];
                this.filteredMagazins = [];
                return;
            }

            // Extraction des données selon différents formats de réponse
            let receivedData = response;
            if (typeof response === 'object' && 'data' in response) {
                receivedData = response.data;
            }

            // Normalisation
            this.magazins = this.normalizeData(receivedData);
            this.filteredMagazins = [...this.magazins];
            
            // Vérification finale
            if (this.magazins.length === 0) {
                this.errorMessage = 'Aucun magasin trouvé';
            }
        },
        error: (error) => {
            console.error('Erreur:', error);
            this.errorMessage = 'Erreur de chargement des données';
            this.magazins = [];
            this.filteredMagazins = [];
        },
        complete: () => {
               this.isLoading = false;
              this.cdr.detectChanges();
            console.log('Données chargées:', {
                magazins: this.magazins,
                filtered: this.filteredMagazins
            });
        }
    });
  
}

LoadCategories() { 
   
}

  // Normalise les données de l'API pour correspondre à notre interface
  private normalizeData(data: any): any[] {
    console.log('🔧 normalizeData called with:', data);
    console.log('📊 Type of data:', typeof data);
    
    // Cas 1: data est null ou undefined
    if (!data) {
      console.log('❌ Data is null or undefined');
      return [];
    }
    
    // Cas 2: data est un tableau
    if (Array.isArray(data)) {
      console.log('✅ Data is an array with', data.length, 'items');
      const result = data.map(item => this.mapSingleItem(item));
      console.log('🔧 Mapped array result:', result);
      return result;
    }
    
    // Cas 3: data est un seul objet
    if (data && typeof data === 'object') {
      console.log('✅ Data is a single object, converting to array');
      const result = [this.mapSingleItem(data)];
      console.log('🔧 Mapped single object result:', result);
      return result;
    }
    
    console.log('❌ Data format not recognized, returning empty array');
    return [];
  }

  // Fonction helper pour mapper un seul item
  private mapSingleItem(item: any): any {
    console.log('🔧 Mapping item:', item);
    const mapped = {
      id: item.uuid || 0,
      name: item.nom_enseigne || 'Nom inconnu',
      address: item.adresse || 'Non renseignée',
      city: item.ville || '',
      postal_code: item.code_postal || '',
      phone: item.telephone || '',
      email: item.email || '',
       category: item.category ? {
      id: item.category.id || 0,
      name:  item.category.nameFr || ''
    } : null,
      siret: item.siret || '',
      description: item.description || '',
      logoUrl: item.logoUrl || '',
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      isActive: item.isActive !== false // Par défaut actif si non spécifié
    };
    console.log('🔧 Mapped result:', mapped);
    return mapped;
  }

  // Méthode de filtrage
applyFilters() {
  // 1. Filtrer les magasins selon recherche et catégorie
  let filtered = this.magazins.filter(magazin => {
    const matchesSearch = !this.searchQuery || 
                         magazin.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         (magazin.address && magazin.address.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                         (magazin.city && magazin.city.toLowerCase().includes(this.searchQuery.toLowerCase()));

    let matchesCategory = true;
    if (this.selectedCategory) {
      if (magazin.category && magazin.category.id) {
        matchesCategory = magazin.category.id.toString() === this.selectedCategory;
      } else {
        matchesCategory = false;
      }
    }

    return matchesSearch && matchesCategory;
  });

  // 2. Calculer le nombre total de pages
  this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
  
  // 3. Corriger la page courante si nécessaire
  if (this.currentPage > this.totalPages) {
    this.currentPage = this.totalPages || 1;
  }

  // 4. Garder TOUS les résultats filtrés dans filteredMagazins
  this.filteredMagazins = filtered;

  console.log('Total filtered:', filtered.length);
  console.log('Current page:', this.currentPage);
  console.log('Total pages:', this.totalPages);
}
getPaginatedItems(): any[] {
  if (!this.filteredMagazins.length) return [];
  
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  return this.filteredMagazins.slice(startIndex, endIndex);
}

  // Pour la compatibilité avec le template
  filterMagazins() {
    console.log('🔍 filterMagazins called from template');
    this.applyFilters();
  }

goToPage(page: number) {
  if (page < 1 || page > this.totalPages) return;
  this.currentPage = page;
  this.applyFilters();
}

nextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.applyFilters();
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.applyFilters();
  }
}


  // Méthodes d'actions
viewDetails(id: string) {
  console.log('🔍 View details for magazin ID:', id);
  this.router.navigate(['/apps/magazinview', id], { queryParams: { mode: 'view' } });
}

editMagazin(magazinid: string) {
  console.log('✏️ Edit magazin ID:', magazinid);
  this.router.navigate(['/apps/magazinview', magazinid], { queryParams: { mode: 'edit' } });
}

  deleteMagazin(id: string) {
    console.log('🗑️ Delete magazin:', id);
    this.magazinService.deletemagazin(id).subscribe({
      next: (response) => {
        console.log('Magazin deleted successfully:', response);
        // Optionally refresh the list of magazins
        this.loadMagazins();
      },
      error: (error) => {
        console.error('Error deleting magazin:', error);
      }
    });
  }

  addStore() {
    console.log('➕ Add new magazin');
    this.router.navigate(['/apps/magazin/add']);
  }

  getVisiblePages() {
  const visiblePageCount = 5; // Nombre de pages visibles autour de la page courante
  let startPages: number[] = [];
  let middlePages: number[] = [];
  let endPages: number[] = [];

  // Toujours afficher les 2 premières pages
  startPages = [1, 2].filter(p => p <= this.totalPages);

  // Pages autour de la page courante
  const start = Math.max(3, this.currentPage - Math.floor(visiblePageCount / 2));
  const end = Math.min(this.totalPages - 2, start + visiblePageCount - 1);

  for (let i = start; i <= end; i++) {
    if (i > 2 && i < this.totalPages - 1) {
      middlePages.push(i);
    }
  }

  // Toujours afficher les 2 dernières pages
  endPages = [this.totalPages - 1, this.totalPages].filter(p => p > 2);

  return { startPages, middlePages, endPages };
}

shouldShowStartEllipsis(): boolean {
  return this.currentPage > 3;
}

shouldShowEndEllipsis(): boolean {
  return this.currentPage < this.totalPages - 2;
}

onItemsPerPageChange() {
  this.currentPage = 1;
  this.totalPages = Math.ceil(this.filteredMagazins.length / this.itemsPerPage);
  this.applyFilters();
}

// Ajoutez cette méthode pour générer les numéros de page
getPageNumbers(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

// Créez une référence locale à Math pour l'utiliser dans le template
get math() {
  return Math;
}
getCategoryColor(categoryId: number): string {
  if (!categoryId) return '#6c757d';
  
  const colors = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', '#4895ef', '#3f37c9'];
  return colors[categoryId % colors.length];
}
}