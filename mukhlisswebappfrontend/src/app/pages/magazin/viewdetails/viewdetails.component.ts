import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MagazinService } from '../magazin.service';
import { CategoryService } from '../../category/category.service';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-viewdetails',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './viewdetails.component.html',
  styleUrl: './viewdetails.component.scss'
})
export class ViewdetailsComponent implements OnInit {
   @ViewChild('fileInput') fileInput!: ElementRef;
  magazinId: any;
  magazin: any = {};
  loading: any;
  error: any;
  selectedCategoryId: number | null = null;
  categories: any[] = [];
  private magazinLoaded = false;
  private categoriesLoaded = false;
  isEditMode: boolean = false;
  selectedLogoFile: File | null = null; // Add this to handle file uploads
  defaultLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik02MCA4MEM3MS4wNDU3IDgwIDgwIDcxLjA0NTcgODAgNjBDODAgNDguOTU0MyA3MS4wNDU3IDQwIDYwIDQwQzQ4Ljk1NDMgNDAgNDAgNDguOTU0MyA0MCA2MEM0MCA3MS4wNDU3IDQ4Ljk1NDMgODAgNjAgODBaIiBmaWxsPSIjRTJFOEYwIi8+Cjwvc3ZnPgo=';
  longitude: number | null = null;
  latitude: number | null = null;
   newPassword: string = '';
    editedMagazin: any = {}; 
    isGeocoding: boolean = false;
passwordVisible: boolean = false;
  passwordFieldType: string = 'password';
  passwordIcon: string = 'visibility';
  constructor(private route: ActivatedRoute, private magazinservice: MagazinService,private snackBar: MatSnackBar, private cdr: ChangeDetectorRef, private categoryService: CategoryService) {}

  ngOnInit() {
    this.magazinId = this.route.snapshot.paramMap.get('id');
    // OU pour les changements dynamiques
    this.route.paramMap.subscribe(params => {
      this.magazinId = params.get('id');
      console.log('Magazin ID:', this.magazinId);
    });

    this.route.queryParams.subscribe(params => {
      this.isEditMode = params['mode'] === 'edit';
      console.log('Mode:', this.isEditMode ? 'Edit' : 'View');
    });

    this.loadCategories();
    this.getMagazinDetails();

    this.cdr.detectChanges();
  }
  openInMaps(): void {
    const lat = this.latitude;
    const lng = this.longitude;
    
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }

  onInputChange(field: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  this.editedMagazin[field] = input.value;
}

   cancelEdit() {
    this.toggleEditMode();
    this.showSnackBar('Modifications annulées', 'info');
  }

  hasCoordinates(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }
    clearCoordinates(): void {
   this.latitude=null;
   this.longitude=null;
    this.showSnackBar('Coordonnées effacées', 'info');
  }

    async geocodeAddress(): Promise<void> {
    const address = this.editedMagazin.adresse;
    console.log('Geocoding address:', address);
    if (!address) {
      this.showSnackBar('Veuillez saisir une adresse', 'warning');
      return;
    }

    try {
      // Exemple avec l'API de géocodage gratuite (Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
  
        this.latitude = parseFloat(result.lat);
        this.longitude = parseFloat(result.lon);
        
        this.showSnackBar('Adresse géocodée avec succès!', 'success');
      } else {
        this.showSnackBar('Adresse introuvable', 'warning');
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      this.showSnackBar('Erreur lors du géocodage de l\'adresse', 'error');
    }
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          

          // Géocodage inverse pour obtenir l'adresse
          this.reverseGeocode(latitude, longitude);
          
          this.showSnackBar('Position actuelle récupérée avec succès!', 'success');
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          this.showSnackBar('Impossible d\'obtenir votre position', 'error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      this.showSnackBar('La géolocalisation n\'est pas supportée par votre navigateur', 'error');
    }
  }
private showSnackBar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: [`snackbar-${type}`]
    });
  }
  async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        
      }
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
    }
  }

  loadCategories(): void {
    this.categoryService.getcategories().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories loaded:', this.categories);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    })
  }

    togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
    this.passwordFieldType = this.passwordVisible ? 'text' : 'password';
    this.passwordIcon = this.passwordVisible ? 'visibility_off' : 'visibility';
  }

  private initializeCategory() {
    console.log('=== INITIALIZE CATEGORY DEBUG ===');
    console.log('magazinLoaded:', this.magazinLoaded);
    console.log('categoriesLoaded:', this.categoriesLoaded);
    console.log('magazin.Categorieid:', this.magazin.Categorieid, typeof this.magazin.Categorieid);

    if (this.magazinLoaded && this.categoriesLoaded && this.magazin.Categorieid) {
      this.selectedCategoryId = Number(this.magazin.Categorieid);
      console.log('selectedCategoryId after conversion:', this.selectedCategoryId, typeof this.selectedCategoryId);
      console.log('Available categories IDs:', this.categories.map(c => ({ id: c.id, type: typeof c.id })));

      // Vérifier si la correspondance existe
      const matchingCategory = this.categories.find(cat => cat.id == this.selectedCategoryId);
      console.log('Matching category found:', matchingCategory);

      this.cdr.detectChanges();
    } else {
      console.log('Conditions not met for initialization');
    }
  }

  onCategoryChange() {
    console.log('Nouvelle catégorie sélectionnée:', this.selectedCategoryId);
    // Update the magazin's category ID
    this.magazin.Categorieid = this.selectedCategoryId;
  }
  
private initializeEditedMagazin() {
    this.isEditMode = { ...this.magazin };
    this.selectedCategoryId = this.magazin.Categorieid ? Number(this.magazin.Categorieid) : null;
  }

toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      // Passer en mode édition - initialiser les données modifiables
      this.initializeEditedMagazin();
    } else {
      // Annuler les modifications - revenir aux données originales
      this.isEditMode = { ...this.magazin };
      this.selectedCategoryId = this.magazin.Categorieid ? Number(this.magazin.Categorieid) : null;
      this.newPassword = '';
      this.selectedLogoFile = null;
      
      // Réinitialiser la preview du logo
      const logoImg = document.querySelector('.store-logo') as HTMLImageElement;
      if (logoImg && this.magazin.logoUrl) {
        logoImg.src = this.magazin.logoUrl;
      }
    }
  }

  getMagazinDetails() {
    console.log('appeled');
    this.loading = true;
    this.error = false;

    this.magazinservice.getmagazinById(this.magazinId).subscribe(
      (response) => {
        if (response.success) {
          this.magazin = response.data;
          this.magazinLoaded = true;
          this.editedMagazin = { ...this.magazin }; 
          this.categoriesLoaded = true;
          this.initializeCategory();
          console.log('Magazin details:', this.magazin);
          console.log('Magazin Categorieid:', this.magazin.Categorieid);
        } else {
          this.error = true;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching magazin details:', error);
        this.error = true;
        this.loading = false;
      }
    );
  }

  goBack() {
    window.history.back();
  }

  onImageError(event: any): void {
    event.target.src = this.defaultLogo;
  }

  // Add this method to handle logo file selection
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFieldChange(field: string, event: Event): void {
  if (!this.isEditMode) return;
  
  const input = event.target as HTMLInputElement;
  this.editedMagazin[field] = input.value;
}

  onLogoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
      
      // Create a preview URL for immediate display
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Update the preview
        const logoImg = document.querySelector('.store-logo') as HTMLImageElement;
        if (logoImg) {
          logoImg.src = e.target.result;
        }
      };
      reader.readAsDataURL(file);
      
      console.log('Logo file selected:', this.selectedLogoFile);
    }
  }

  onSelectChange(field: string, value: any): void {
    if (!this.isEditMode) return;
    this.editedMagazin[field] = value;
  }



   onAddressChange(field: string, event: Event): void {
  if (!this.isEditMode) return;
  
  const input = event.target as HTMLInputElement;
  this.editedMagazin[field] = input.value;
  
  console.log('Nouvelle adresse:', this.editedMagazin.adresse);
}

  openMap(): void {
    if (this.magazin?.latitude && this.magazin?.longitude) {
      const url = `https://www.google.com/maps?q=${this.magazin.latitude},${this.magazin.longitude}`;
      window.open(url, '_blank');
    } else if (this.magazin?.adresse) {
      const url = `https://www.google.com/maps?q=${encodeURIComponent(this.magazin.adresse)}`;
      window.open(url, '_blank');
    }
  }

   async onAddressBlur(): Promise<void> {
    if (this.isEditMode && this.editedMagazin.adresse) {
      // Géocoder automatiquement quand l'utilisateur quitte le champ adresse
      await this.geocodeAddress();
    }
  }

saveMagazin() {
  if (!this.isEditMode) return;

  const magazinData = { ...this.editedMagazin };
  
  console.log('selected file:', this.selectedLogoFile);

  // Handle logo update logic
  if (this.selectedLogoFile) {
    const formData = new FormData();
    
    // Ajouter le fichier logo
    formData.append('logoUrl', this.selectedLogoFile);
    
    // SUPPRIMER l'ancien logoUrl du magazinData pour éviter les doublons
    delete magazinData.logoUrl;
    
    // Ajouter TOUTES les autres données au FormData
    Object.keys(magazinData).forEach(key => {
      if (key !== 'category' && magazinData[key] !== null && magazinData[key] !== undefined) {
        const value = magazinData[key];
        
        // Gérer les différents types de données
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Debug FormData
    this.debugFormData(formData);

    console.log('Mise à jour avec nouveau logo');
    
    // Appeler le service avec formData
    this.magazinservice.UpdateMagazin(formData).subscribe({
      next: (response) => {
        console.log('Magazin mis à jour avec succès:', response);
        if (response.success && response.data) {
          this.magazin = response.data;
        }
        this.selectedLogoFile = null;
        this.newPassword = '';
        this.showSnackBar('Magazin mis à jour avec succès!', 'success');
        this.isEditMode = false;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du magazin:', error);
        this.showSnackBar('Erreur lors de la mise à jour. Veuillez réessayer.', 'error');
      }
    });
  } else {
    // No new logo file - send normal JSON data
    console.log('Sauvegarde des modifications sans new logo', magazinData);
    
    this.magazinservice.UpdateMagazin(magazinData).subscribe({
      next: (response) => {
        console.log('Magazin mis à jour avec succès:', response);
        if (response.success && response.data) {
          this.magazin = response.data;
        }
        this.newPassword = '';
        this.showSnackBar('Magazin mis à jour avec succès!', 'success');
        this.isEditMode = false;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du magazin:', error);
        this.showSnackBar('Erreur lors de la mise à jour. Veuillez réessayer.', 'error');
      }
    });
  }
}

// Méthode helper pour debugger FormData
debugFormData(formData: FormData) {
  console.log('FormData contents:');
  formData.forEach((value, key) => {
    console.log(`${key}:`, value);
  });
}
}
