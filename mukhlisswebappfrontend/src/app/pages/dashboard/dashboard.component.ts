import { Component, ViewChild, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { ModalConfig, ModalComponent } from '../../_metronic/partials';
import { MagazinService } from '../magazin/magazin.service';
import { CategoryService } from '../category/category.service';
import Chart from 'chart.js/auto';
import { ChangeDetectorRef } from '@angular/core';
import { ClientService } from '../client/client.service';
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
  totalClients: number =0;
  isLoading: boolean = false;
  chart: any;
  
  // Variables pour suivre le chargement
  private magazinsLoaded: boolean = false;
  private categoriesLoaded: boolean = false;
  private clientsLoaded: boolean = false;
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
    
    // Charger les magasins
    this.magazinService.getmagazins().subscribe(
      (res) => {
        this.totalMagazins = res.data.length;
        this.magazinsLoaded = true;
        
        console.log('Total magasins chargés:', this.totalMagazins);
        
        // Vérifier si on peut créer le graphique
        this.checkAndCreateChart();
      },
      (error) => {
        console.error('Erreur lors du chargement des magasins', error);
        this.isLoading = false;
      }
    );

    // Charger les catégories
    this.categoryService.getcategories().subscribe(
      (res) => {
        this.totalCategories = res.length;
        this.categoriesLoaded = true;
        
        console.log('Total catégories chargées:', this.totalCategories);
        
        // Vérifier si on peut créer le graphique
        this.checkAndCreateChart();
      },
      (error) => {
        console.error('Erreur lors du chargement des catégories', error);
        this.isLoading = false;
      }
    );

    // Charger les clients
    this.clientservice.getClients().subscribe(
      (res) => {
        this.totalClients = res.length;
        this.clientsLoaded = true;
        
        console.log('Total clients chargés:', this.totalClients);
        
        // Vérifier si on peut créer le graphique
        this.checkAndCreateChart();
      },
      (error) => {
        console.error('Erreur lors du chargement des clients', error);
        this.isLoading = false;
      }
    );
  }

  // Méthode pour vérifier si toutes les données sont chargées avant de créer le graphique
  private checkAndCreateChart(): void {
    if (this.magazinsLoaded && this.categoriesLoaded && this.clientsLoaded) {
      this.isLoading = false;
      console.log('Toutes les données sont chargées, création du graphique...');
      console.log('Données finales:', {
        totalMagazins: this.totalMagazins,
        totalCategories: this.totalCategories,
        totalClients: this.totalClients
      });
      
      // Attendre que le DOM soit prêt
      setTimeout(() => {
        if (this.magazinChart) {
          this.createChart();
        }
      }, 100);
      
      this.cdr.detectChanges();
    }
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
      maintainAspectRatio: true, // Changé à true pour contrôler la taille
      aspectRatio: 2, // Ratio largeur/hauteur (plus élevé = plus large, plus bas = plus haut)
      layout: {
        padding: 10 // Réduire le padding autour du graphique
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 10 // Réduire la taille de la police
            },
            callback: function(value) {
              return Number.isInteger(value) ? value : '';
            }
          },
          title: {
            display: true,
            text: 'Quantité',
            font: {
              size: 12 // Réduire la taille du titre
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 10 // Réduire la taille de la police
            }
          },
          title: {
            display: true,
            text: 'Types',
            font: {
              size: 12 // Réduire la taille du titre
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
              size: 11 // Réduire la taille de la légende
            },
            padding: 10 // Réduire l'espacement
          }
        },
        title: {
          display: true,
          text: 'Nombre total de magasins et catégories',
          font: {
            size: 14 // Réduire la taille du titre principal
          },
          padding: 10 // Réduire l'espacement
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