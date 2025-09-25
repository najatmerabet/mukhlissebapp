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

   getCategoryName(categoryId: number): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Inconnu';
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

  onCoordinatesChange(): void {
    // Cette méthode est appelée lorsque les coordonnées changent
    console.log('Coordonnées mises à jour:', this.latitude, this.longitude);
  }

  private transformDataForGeometry(data: any): any {
    console.log('Transforming data for geometry:', data);
    const transformedData = { ...data };
     console.log('=== TRANSFORM DATA DEBUG ===', transformedData);
    // Créer une géométrie au format WKB hexadécimal (string)
    if (data.latitude && data.longitude) {
      // Convertir les coordonnées en format WKB hexadécimal
      transformedData.geom = this.createPointWKBHex(
        parseFloat(data.longitude), 
        parseFloat(data.latitude)
      );
      
      // Supprimer les champs latitude et longitude si l'API ne les attend pas
      delete transformedData.latitude;
      delete transformedData.longitude;
    }

    // S'assurer que la catégorie est correctement formatée
   console.log('=== TRANSFORM DATA DEBUG ===', transformedData);
    return transformedData;
     
  }

  private createPointWKBHex(longitude: number, latitude: number): string {
    
    const byteOrder = '01';
    const wkbType = '01000000'; 
    const srid = '461E0000'; // 461E0000 -> 00001E46 -> 7750? Correction nécessaire
    const sridCorrect = '10270000'; // 00002710 = 10000? Non, essayons autre chose
    const srid4326 = '10270000'; // En little endian: 00 00 27 10 -> 0x00001027 = 4135? 
    const sridPostgis = 'E6100000'; // Big endian, mais nous devons l'écrire en little endian
    const byteOrderNoSrid = '01';
    const wkbTypeNoSrid = '01000000'; // Point (1) sans SRID
    const longBuffer = this.float64ToHexLe(longitude);
    const latBuffer = this.float64ToHexLe(latitude);
    console.log('Longitude WKB Hex:',  byteOrderNoSrid + wkbTypeNoSrid + longBuffer + latBuffer);
    // Format sans SRID (plus simple)
    return byteOrderNoSrid + wkbTypeNoSrid + longBuffer + latBuffer;
  }
  private float64ToHexLe(value: number): string {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, value, true); // true pour little endian
    
    const hexParts = [];
    for (let i = 0; i < 8; i++) {
      const byte = view.getUint8(i);
      hexParts.push(byte.toString(16).padStart(2, '0'));
    }
    
    return hexParts.join('');
  }
saveMagazin() {
    if (!this.isEditMode) return;
    
    // S'assurer que les données géographiques sont à jour
    if (this.latitude && this.longitude) {
      console.log("Updating geometry with lat/lng:", this.latitude, this.longitude);
      this.editedMagazin.geom = `POINT(${this.longitude} ${this.latitude})`;
     
      console.log("Transformed geometry:", this.editedMagazin.geom);
    }
    
    // Le reste de votre logique de sauvegarde...
    const magazinData = { ...this.editedMagazin };
    
    console.log('selected file:', this.selectedLogoFile);

    if (this.selectedLogoFile) {
      const formData = new FormData();
      formData.append('logoUrl', this.selectedLogoFile);
      delete magazinData.logoUrl;
      
      Object.keys(magazinData).forEach(key => {
        if (key !== 'category' && magazinData[key] !== null && magazinData[key] !== undefined) {
          const value = magazinData[key];
          
          if (typeof value === 'object' && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

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
