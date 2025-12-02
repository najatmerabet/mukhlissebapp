import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← Ajouter cette importation
import { ClientService } from './client.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule], // ← Ajouter FormsModule ici
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {
  clients: any[] = [];
  filteredClients: any[] = []; // ← Ajouter cette propriété
  paginatedClients: any[] = [];
  
  // Variables de pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  pageSizeOptions: number[] = [5, 10, 20, 50];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Recherche
  searchTerm: string = '';
  // Exposer Math pour le template
  Math = Math; // ← Ajouter cette ligne

  constructor(private clientservice: ClientService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getClients();
  }

  getClients() {
    this.isLoading = true;
    this.clientservice.getClients().subscribe(
      (res) => {
        this.clients = res || [];
        this.filteredClients = [...this.clients]; // ← Initialiser filteredClients
        console.log('Clients data:', res);
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching clients:', error);
        this.clients = [];
        this.filteredClients = [];
        this.paginatedClients = [];
        this.isLoading = false;
        this.errorMessage = 'Une erreur est survenue lors du chargement des clients.';
        this.cdr.detectChanges();
      }
    );
  }

  // Filtrer les clients
  filterClients(): void {
    if (!this.searchTerm) {
      this.filteredClients = [...this.clients];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        (client.prenom?.toLowerCase().includes(searchLower)) ||
        (client.nom?.toLowerCase().includes(searchLower)) ||
        (client.email?.toLowerCase().includes(searchLower)) ||
        (client.telephone?.includes(this.searchTerm))
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  // Mettre à jour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
    
    // S'assurer que la page actuelle est valide
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages > 0 ? this.totalPages : 1;
    }
    
    // Calculer les indices de début et fin
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredClients.length);
    
    this.paginatedClients = this.filteredClients.slice(startIndex, endIndex);
  }

  // Changer de page
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Gérer le clic sur les numéros de page
  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
    // Si c'est '...', on ne fait rien
  }

  // Page précédente
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // Page suivante
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // Changer le nombre d'éléments par page
  changeItemsPerPage(event: any) { // ← Changer le paramètre pour Event
    this.itemsPerPage = Number(event.target.value);
    this.currentPage = 1;
    this.updatePagination();
  }

  // Obtenir la plage d'affichage (ex: "1-10 sur 50")
  getDisplayRange(): string {
    if (this.filteredClients.length === 0) return '0-0 sur 0';
    
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredClients.length);
    
    return `${start}-${end} sur ${this.filteredClients.length}`;
  }

  // Générer les numéros de page à afficher (avec ellipsis)
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Afficher toutes les pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour les ellipsis
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(this.currentPage - 1);
        pages.push(this.currentPage);
        pages.push(this.currentPage + 1);
        pages.push('...');
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // Obtenir les pages visibles avec ellipses (pour totalPages > 7)
  getVisiblePages(): { startPages: number[], middlePages: number[], endPages: number[] } {
    const startPages: number[] = [];
    const middlePages: number[] = [];
    const endPages: number[] = [];

    // Toujours afficher les 3 premières pages
    for (let i = 1; i <= Math.min(3, this.totalPages); i++) {
      startPages.push(i);
    }

    // Pages du milieu (autour de la page courante)
    const startMiddle = Math.max(4, this.currentPage - 1);
    const endMiddle = Math.min(this.totalPages - 3, this.currentPage + 1);

    for (let i = startMiddle; i <= endMiddle; i++) {
      if (i > 3 && i < this.totalPages - 2) {
        middlePages.push(i);
      }
    }

    // Toujours afficher les 3 dernières pages
    for (let i = Math.max(this.totalPages - 2, 4); i <= this.totalPages; i++) {
      if (i > startPages[startPages.length - 1] && !middlePages.includes(i)) {
        endPages.push(i);
      }
    }

    return { startPages, middlePages, endPages };
  }

  // Vérifier si on doit afficher l'ellipse de début
  shouldShowStartEllipsis(): boolean {
    return this.currentPage > 4;
  }

  // Vérifier si on doit afficher l'ellipse de fin
  shouldShowEndEllipsis(): boolean {
    return this.currentPage < this.totalPages - 3;
  }

  exportToCSV() {
    if (!this.clients || this.clients.length === 0) {
      alert('Aucun client à exporter');
      return;
    }

    const headers = ['#', 'Prénom', 'Nom', 'Email', 'Téléphone'];
    
    // Formatage des données avec échappement correct
    const csvData = this.clients.map((client, index) => [
      index + 1,
      this.escapeCSVField(client.prenom || 'Non renseigné'),
      this.escapeCSVField(client.nom || 'Non renseigné'),
      this.escapeCSVField(client.email || 'Non renseigné'),
      this.escapeCSVField(client.telephone || 'Non renseigné')
    ]);

    // Ajouter BOM pour Excel et utiliser point-virgule
    const BOM = '\uFEFF'; // Byte Order Mark pour Excel
    const csvContent = BOM + [headers, ...csvData]
      .map(row => row.join(';')) // Point-virgule au lieu de virgule
      .join('\r\n'); // Retour chariot Windows pour Excel

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `liste-clients-${new Date().toLocaleDateString('fr-FR')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Méthode pour échapper correctement les champs CSV
  escapeCSVField(field: string): string {
    if (field === null || field === undefined) {
      return '';
    }
    
    const stringField = String(field);
    
    // Si le champ contient des guillemets, des virgules ou des sauts de ligne
    if (stringField.includes('"') || stringField.includes(';') || stringField.includes('\n') || stringField.includes('\r')) {
      return `"${stringField.replace(/"/g, '""')}"`; // Échapper les guillemets doubles
    }
    
    return stringField;
  }
}