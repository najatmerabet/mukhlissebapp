import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from './client.service';
import { ChangeDetectorRef } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {
  clients: any[] = [];
  paginatedClients: any[] = [];
  
  // Variables de pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  pageSizeOptions: number[] = [ 5, 10, 20, 50];
  
  // États de chargement
  isLoading: boolean = true;

  constructor(private clientservice: ClientService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getClients();
  }

  getClients() {
    this.isLoading = true;
    this.clientservice.getClients().subscribe(
      (res) => {
        this.clients = res || [];
        console.log('Clients data:', res);
        this.updatePagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching clients:', error);
        this.clients = [];
        this.paginatedClients = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  // Mettre à jour la pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.clients.length / this.itemsPerPage);
    
    // S'assurer que la page actuelle est valide
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages > 0 ? this.totalPages : 1;
    }
    
    // Calculer les indices de début et fin
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.clients.length);
    
    this.paginatedClients = this.clients.slice(startIndex, endIndex);
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
  changeItemsPerPage(newSize: number) {
    this.itemsPerPage = +newSize; // S'assurer que c'est un nombre
    this.currentPage = 1; // Revenir à la première page
    this.updatePagination();
  }

  // Obtenir la plage d'affichage (ex: "1-10 sur 50")
  getDisplayRange(): string {
    if (this.clients.length === 0) return '0-0 sur 0';
    
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.clients.length);
    
    return `${start}-${end} sur ${this.clients.length}`;
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

  exportToPDF() {
    if (!this.clients || this.clients.length === 0) {
      alert('Aucun client à exporter');
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('LISTE DES CLIENTS', 105, 15, { align: 'center' });

    // Export date
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(10);
    doc.text(`Exporté le: ${date}`, 105, 22, { align: 'center' });

    // Table data
    const tableData = this.clients.map((client, index) => [
      (index + 1).toString(),
      client.prenom || 'Non renseigné',
      client.nom || 'Non renseigné',
      client.email || 'Non renseigné',
      client.telephone || 'Non renseigné'
    ]);

    autoTable(doc, {
      head: [['#', 'Prénom', 'Nom', 'Email', 'Téléphone']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 135, 245] }
    });

    doc.save(`liste-clients-${date}.pdf`);
  }

  exportToCSV() {
    if (!this.clients || this.clients.length === 0) {
      alert('Aucun client à exporter');
      return;
    }

    const headers = ['#', 'Prénom', 'Nom', 'Email', 'Téléphone'];
    const csvData = this.clients.map((client, index) => [
      index + 1,
      client.prenom || 'Non renseigné',
      client.nom || 'Non renseigné',
      client.email || 'Non renseigné',
      client.telephone || 'Non renseigné'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

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
}