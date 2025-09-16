import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../category/category.service';
import { MagazinService } from '../magazin.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-magazine-form',
  templateUrl: './addmagazin.component.html',
  styleUrls: ['./addmagazin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ]
})
export class AddmagazinComponent implements OnInit {
  magazineForm!: FormGroup;
  categories: any[] = [];
  useMapSelection = false;
  selectedFileName: string = '';
  isGeocoding = false;
  
  // Subject pour le debounce de la saisie d'adresse
  private addressSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private categoryservice: CategoryService,
    private magazinService: MagazinService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.setupAddressAutoGeocoding();
  }

  /**
   * Configuration du géocodage automatique lors de la saisie d'adresse
   */
  private setupAddressAutoGeocoding(): void {
    this.addressSubject.pipe(
      debounceTime(1000), // Attendre 1 seconde après la dernière saisie
      distinctUntilChanged() // Éviter les requêtes en double
    ).subscribe(address => {
      if (address && address.length > 10) { // Minimum 10 caractères pour une adresse
        this.geocodeAddressAuto(address);
      }
    });
  }

  loadCategories(): void {
    this.categoryservice.getcategories().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories loaded:', this.categories);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });
  }

  // Gestion du fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.showSnackBar('Type de fichier non supporté. Utilisez JPG ou PNG.', 'error');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showSnackBar('Le fichier est trop volumineux. Maximum 5MB.', 'error');
        return;
      }

      this.magazineForm.patchValue({
        logoUrl: file
      });
      
      this.selectedFileName = file.name;
      this.magazineForm.get('logoUrl')?.markAsDirty();

      console.log('Fichier sélectionné:', file.name);
    }
  }

  clearLogo(): void {
    this.magazineForm.patchValue({
      logoUrl: ''
    });
    this.selectedFileName = '';
    this.showSnackBar('Logo effacé', 'info');
    console.log('Logo cleared');
  }

  private initForm(): void {
    this.magazineForm = this.fb.group({
      nom_enseigne: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      latitude: ['', [
        Validators.required,
        Validators.min(-90),
        Validators.max(90)
      ]],
      longitude: ['', [
        Validators.required,
        Validators.min(-180),
        Validators.max(180)
      ]],
      adresse: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      siret: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      code_postal: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      ville: ['', [Validators.required]],
      telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{10,15}$')]],
      logoUrl: ['', [Validators.required]]
    });
  }

  /**
   * Méthode appelée lors du changement d'adresse
   * Déclenche le géocodage automatique avec debounce
   */
  onAddressChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const adresse = target.value.trim();
    
    console.log('Adresse saisie:', adresse);
    
    if (adresse.length > 3) {
      this.addressSubject.next(adresse);
    } else if (adresse.length === 0) {
      // Si l'adresse est vidée, vider aussi les coordonnées
      this.clearCoordinates();
    }
  }

  /**
   * Géocodage automatique lors de la saisie d'adresse
   */
  private async geocodeAddressAuto(address: string): Promise<void> {
    if (this.isGeocoding) {
      return; // Éviter les requêtes simultanées
    }

    this.isGeocoding = true;
    console.log('Géocodage automatique pour:', address);

    try {
      // Utilisation de l'API Nominatim (gratuite)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=fr`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        // Mettre à jour les champs latitude et longitude
        this.magazineForm.patchValue({
          latitude: latitude,
          longitude: longitude
        });

        // Optionnellement, mettre à jour l'adresse avec l'adresse formatée
        if (result.display_name && result.display_name !== address) {
          this.magazineForm.patchValue({
            adresse: result.display_name
          });
        }

        console.log('Coordonnées trouvées automatiquement:', { latitude, longitude });
        this.showSnackBar('Coordonnées récupérées automatiquement!', 'success');
      }
    } catch (error) {
      console.error('Erreur lors du géocodage automatique:', error);
      // Ne pas afficher d'erreur pour le géocodage automatique
    } finally {
      this.isGeocoding = false;
    }
  }



  // Géocodage inverse: convertir des coordonnées en adresse
  async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=fr`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        this.magazineForm.patchValue({
          adresse: data.display_name
        });
      }
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
    }
  }

  // Basculer entre saisie manuelle et sélection sur carte
  toggleMapSelection(): void {
    this.useMapSelection = !this.useMapSelection;
  }

  // Effacer les coordonnées
  clearCoordinates(): void {
    this.magazineForm.patchValue({
      latitude: '',
      longitude: ''
    });
    this.showSnackBar('Coordonnées effacées', 'info');
  }

  // Vérifier si des coordonnées sont présentes
  hasCoordinates(): boolean {
    const lat = this.magazineForm.get('latitude')?.value;
    const lng = this.magazineForm.get('longitude')?.value;
    return lat && lng && !isNaN(lat) && !isNaN(lng);
  }

  // Ouvrir dans Google Maps
  openInMaps(): void {
    const lat = this.magazineForm.get('latitude')?.value;
    const lng = this.magazineForm.get('longitude')?.value;
    
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }

  // Utilitaire pour afficher des messages
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: [`snackbar-${type}`]
    });
  }
  
  onSubmit(): void {
    if (this.magazineForm.valid) {
      console.log('Valeurs du formulaire:', this.magazineForm.value);
      
      const formData = new FormData();
      const logoFile = this.magazineForm.get('logoUrl')?.value;

      console.log('Logo file object:', logoFile);
      console.log('Is File instance:', logoFile instanceof File);
      
      if (logoFile && logoFile instanceof File) {
        formData.append('logoUrl', logoFile, logoFile.name);
      }

      // Ajouter tous les champs du formulaire
      formData.append('nom_enseigne', this.magazineForm.get('nom_enseigne')?.value || '');
      formData.append('description', this.magazineForm.get('description')?.value || '');
      formData.append('Categorieid', this.magazineForm.get('category')?.value || '');
      formData.append('email', this.magazineForm.get('email')?.value || '');
      
      const adresseValue = this.magazineForm.get('adresse')?.value;
      if (adresseValue) {
        formData.append('adresse', adresseValue);
      }
      
      formData.append('latitude', this.magazineForm.get('latitude')?.value || '');
      formData.append('longitude', this.magazineForm.get('longitude')?.value || '');
      formData.append('password', this.magazineForm.get('password')?.value || '');
      formData.append('siret', this.magazineForm.get('siret')?.value || '');
      
      const codePostalValue = this.magazineForm.get('code_postal')?.value;
      if (codePostalValue) {
        formData.append('code_postal', codePostalValue);
      }
      
      formData.append('ville', this.magazineForm.get('ville')?.value || '');
      formData.append('telephone', this.magazineForm.get('telephone')?.value || '');

      // Afficher le contenu du FormData
      console.log('=== CONTENU DU FORMDATA ===');
      for (let [key, value] of (formData as any).entries()) {
        console.log(key + ': ', value);
      }
      console.log('==========================');

      this.magazinService.addmagazin(formData).subscribe({
        next: (response) => {
          console.log('Réponse du serveur:', response);
          this.showSnackBar('Magazine enregistré avec succès!', 'success');
          this.magazineForm.reset();
          this.selectedFileName = '';
        },
        error: (error) => {
          console.error('Erreur lors de l\'enregistrement du magazine:', error);
          console.error('Détails de l\'erreur:', error.error);
          
          if (error.status === 422 && error.error?.errors) {
            const errorMessages = Object.keys(error.error.errors).map(key => 
              `${key}: ${error.error.errors[key].join(', ')}`
            );
            this.showSnackBar(`Erreurs de validation: ${errorMessages.join('; ')}`, 'error');
          } else {
            this.showSnackBar('Erreur lors de l\'enregistrement du magazine', 'error');
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.magazineForm);
      const invalidFields = this.getInvalidFields(this.magazineForm);
      console.log('Champs invalides:', invalidFields);
      this.showSnackBar(`Veuillez corriger les erreurs dans les champs: ${invalidFields.join(', ')}`, 'error');
    }
  }

  // Marque tous les champs du formulaire comme "touched"
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Récupère les noms des champs invalides
  private getInvalidFields(formGroup: FormGroup): string[] {
    const invalidFields: string[] = [];
    
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup) {
        invalidFields.push(...this.getInvalidFields(control).map(subKey => `${key}.${subKey}`));
      } else if (control?.invalid) {
        invalidFields.push(key);
      }
    });
    
    return invalidFields;
  }
}