import { Component, ViewChild, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { ModalConfig, ModalComponent } from '../../_metronic/partials';
import { MagazinService } from '../magazin/magazin.service';
import { CategoryService } from '../category/category.service';
import Chart from 'chart.js/auto';
import { ChangeDetectorRef } from '@angular/core';
import { ClientService } from '../client/client.service';
import { combineLatest } from 'rxjs'; // Import combineLatest

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  modalConfig: ModalConfig = {
    modalTitle: 'Modal title',
    dismissButtonLabel: 'Submit',
    closeButtonLabel: 'Cancel'
  };
  
  @ViewChild('modal') private modalComponent: ModalComponent;
  @ViewChild('magazinChart') magazinChart: ElementRef;

  totalMagazins: number = 0;
  totalCategories: number = 0;
  totalClients: number = 0;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  chart: any;
  
  constructor(
    private magazinService: MagazinService, 
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private clientservice: ClientService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Le graphique sera créé après le chargement des données
  }

  async openModal() {
    return await this.modalComponent.open();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Utiliser combineLatest pour exécuter tous les appels en parallèle
    combineLatest([
      this.magazinService.getmagazins(),
      this.categoryService.getcategories(),
      this.clientservice.getClients()
    ]).subscribe({
      next: ([magazinRes, categoryRes, clientRes]) => {
        // Traitement des magasins
        this.totalMagazins = magazinRes?.data?.length || 0;
        
        // Traitement des catégories
        this.totalCategories = categoryRes?.length || 0;
        
        // Traitement des clients
        this.totalClients = clientRes?.length || 0;
        
        console.log('Toutes les données chargées:', {
          totalMagazins: this.totalMagazins,
          totalCategories: this.totalCategories,
          totalClients: this.totalClients
        });
        
        this.isLoading = false;
        
        // Créer le graphique après un délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
          if (this.magazinChart) {
            this.createChart();
          }
        }, 100);
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données', error);
        this.hasError = true;
        this.errorMessage = 'Impossible de charger les données. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  retryLoadData(): void {
    this.loadData();
  }

  createChart(): void {
    console.log('=== CRÉATION DU GRAPHIQUE ===');
    console.log('Données utilisées:', {
      magasins: this.totalMagazins,
      categories: this.totalCategories,
      clients: this.totalClients
    });
    
    // Vérifier que les données sont valides
    if (this.totalMagazins === undefined || this.totalCategories === undefined || this.totalClients === undefined) {
      console.error('❌ Données manquantes pour créer le graphique');
      return;
    }
    
    // Détruire le graphique existant s'il existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Vérifier que l'élément canvas existe
    if (!this.magazinChart?.nativeElement) {
      console.error('❌ Élément canvas non disponible');
      return;
    }

    const ctx = this.magazinChart.nativeElement.getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Magasins', 'Catégories', 'Clients'],
        datasets: [{
          label: 'Quantité',
          data: [this.totalMagazins, this.totalCategories, this.totalClients],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        layout: {
          padding: 10
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 10
              },
              callback: function(value) {
                return Number.isInteger(value) ? value : '';
              }
            },
            title: {
              display: true,
              text: 'Quantité',
              font: {
                size: 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 10
              }
            },
            title: {
              display: true,
              text: 'Types',
              font: {
                size: 12
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 11
              },
              padding: 10
            }
          },
          title: {
            display: true,
            text: 'Statistiques globales',
            font: {
              size: 14
            },
            padding: 10
          },
          tooltip: {
            titleFont: {
              size: 12
            },
            bodyFont: {
              size: 11
            },
            callbacks: {
              label: function(context: any) {
                return `${context.dataset.label}: ${context.raw}`;
              }
            }
          }
        }
      }
    });
    
    console.log('✅ Graphique créé avec succès');
  }
}