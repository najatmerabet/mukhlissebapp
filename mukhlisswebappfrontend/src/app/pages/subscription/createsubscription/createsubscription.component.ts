import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MagazinService } from '../../magazin/magazin.service'; // Service pour récupérer les magasins
import { SubscriptionService } from '../subscription.service';
import { start } from 'repl';
import { CreateSubscriptionRequest } from '../subscription.models';


@Component({
  selector: 'app-createsubscription',
  templateUrl: './createsubscription.component.html',
  styleUrls: ['./createsubscription.component.scss']
})
export class CreatesubscriptionComponent implements OnInit {
  subscriptionForm!: FormGroup;
  magazins: any[] = []; // Liste des magasins
  isLoading = false;
  loadingMagazins = false;
  errorMessage = '';
selectedMagazin: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private magazinService: MagazinService,
    private subscriptionService: SubscriptionService,
    private cdr: ChangeDetectorRef
  ) {
     this.subscriptionForm = this.fb.group({
      magazin_id: [''],
      start_date: [''],
      end_date: [''],
      price: [0],
      payment_method: [''],
      contact_email: [''],
      contact_phone: [''],
      admin_notes: ['']
    });
  }

  ngOnInit(): void {
    
    this.loadMagazins();
  }

initForm(): void {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  
  let defaultMagazinId = '';
  let defaultContactEmail = '';
  let defaultContactPhone = '';
  
  if (this.magazins.length > 0) {
    const firstMagazin = this.magazins[0];
    
    console.log('Premier magasin:', firstMagazin);
    console.log('UUID du premier magasin:', firstMagazin?.uuid);
    
    // UTILISEZ uuid au lieu de id
    if (firstMagazin && firstMagazin.uuid) {
      defaultMagazinId = String(firstMagazin.uuid);
      defaultContactEmail = firstMagazin.email || '';
      defaultContactPhone = firstMagazin.telephone || firstMagazin.phone || '';
    }
  }
  
  console.log('Valeurs par défaut pour le formulaire:', {
    defaultMagazinId,
    defaultContactEmail,
    defaultContactPhone
  });
  
  this.subscriptionForm = this.fb.group({
    magazin_id: [defaultMagazinId, Validators.required],
    start_date: [this.formatDate(today), Validators.required],
    end_date: [this.formatDate(nextMonth), Validators.required],
    price: [29.99, [Validators.required, Validators.min(0)]],
    payment_method: ['bank_transfer', Validators.required],
    contact_email: [defaultContactEmail, [Validators.email]],
    contact_phone: [defaultContactPhone, [Validators.pattern(/^[0-9+\-\s()]*$/)]],
    admin_notes: ['']
  });

  // Observateur pour la date de fin
  this.subscriptionForm.get('start_date')?.valueChanges.subscribe(startDate => {
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      
      this.subscriptionForm.patchValue({
        end_date: this.formatDate(end)
      }, { emitEvent: false });
    }
  });

  // Observateur pour remplir email et téléphone - UTILISEZ uuid
  this.subscriptionForm.get('magazin_id')?.valueChanges.subscribe(magazinId => {
    console.log('Magazine UUID changé:', magazinId);
    
    if (magazinId && magazinId !== '' && this.magazins.length > 0) {
      // CHERCHEZ par uuid au lieu de id
      this.selectedMagazin = this.magazins.find(m => m.uuid == magazinId);
      console.log('Magasin sélectionné:', this.selectedMagazin);
      
      if (this.selectedMagazin) {
        this.subscriptionForm.patchValue({
          contact_email: this.selectedMagazin.email || '',
          contact_phone: this.selectedMagazin.telephone || this.selectedMagazin.phone || ''
        }, { emitEvent: false });
      }
    } else {
      this.selectedMagazin = null;
      this.subscriptionForm.patchValue({
        contact_email: '',
        contact_phone: ''
      }, { emitEvent: false });
    }
    
    this.cdr.detectChanges();
  });
}

getSelectedMagazin(): any {
  const magazinId = this.subscriptionForm.get('magazin_id')?.value;
  console.log('Valeur brute du formulaire:', magazinId);
  
  if (magazinId && this.magazins.length > 0) {
    // CHERCHEZ par uuid
    const found = this.magazins.find(m => m.uuid == magazinId);
    console.log('Magasin trouvé:', found);
    return found;
  }
  return null;
}

formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
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
                return;
            }

            // Extraction des données selon différents formats de réponse
            let receivedData = response;
            if (typeof response === 'object' && 'data' in response) {
                receivedData = response.data;
            }

            // CORRECTION ICI : Assurez-vous d'assigner les données
            if (Array.isArray(receivedData)) {
                this.magazins = receivedData;
            } else if (receivedData && typeof receivedData === 'object') {
                // Si c'est un objet, essayez de trouver un tableau à l'intérieur
                const possibleArrays = ['results', 'items', 'magazins', 'list'];
                for (const key of possibleArrays) {
                    if (Array.isArray(receivedData[key])) {
                        this.magazins = receivedData[key];
                        break;
                    }
                }
                
                // Si toujours pas trouvé, essayez de convertir les valeurs en tableau
                if (this.magazins.length === 0) {
                    this.magazins = Object.values(receivedData).filter(item => 
                        item && typeof item === 'object'
                    ) as any[];
                }
            }
            
            // Vérification finale
            if (this.magazins.length === 0) {
                this.errorMessage = 'Aucun magasin trouvé dans la réponse';
                console.log('Données reçues mais pas au format attendu:', receivedData);
            }
              console.log('===== STRUCTURE DES MAGASINS =====');
            console.log('Nombre de magasins:', this.magazins.length);
            if (this.magazins.length > 0) {
                console.log('Premier magasin complet:', this.magazins[0]);
                console.log('Clés disponibles:', Object.keys(this.magazins[0]));
                console.log('ID du premier magasin:', this.magazins[0].id);
            }
            console.log('===================================');
            // INITIALISEZ LE FORMULAIRE APRÈS AVOIR CHARGÉ LES MAGASINS
            this.initForm();
        },
        error: (error) => {
            console.error('Erreur détaillée:', error);
            this.errorMessage = `Erreur de chargement: ${error.status || 'inconnue'}`;
            this.magazins = [];
            // Initialisez quand même le formulaire même en cas d'erreur
            this.initForm();
        },
        complete: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
            console.log('Données chargées:', {
                magazins: this.magazins,
                count: this.magazins.length
            });
        }
    });
}
 
onSubmit(): void {
  console.log('Submitting form with values:', this.subscriptionForm.value);
  console.log('Form valid?', this.subscriptionForm.valid);
  
  if (this.subscriptionForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.subscriptionForm.value;
    
    // Vérifiez que magazin_id n'est pas null ou undefined
    if (!formData.magazin_id || formData.magazin_id === 'undefined') {
      this.errorMessage = 'Veuillez sélectionner un magasin';
      this.isLoading = false;
      return;
    }
    
    // Récupérer le magasin sélectionné
    const selectedMagazin = this.getSelectedMagazin();
    
    if (!selectedMagazin) {
      this.errorMessage = 'Magasin sélectionné non trouvé';
      this.isLoading = false;
      return;
    }
    
    // Préparez les données selon l'interface CreateSubscriptionRequest
    const subscriptionData: CreateSubscriptionRequest = {
      magasin_id: String(formData.magazin_id),
      start_date: formData.start_date,
      end_date: formData.end_date,
      payment_method: formData.payment_method,
      contact_email: selectedMagazin.email || formData.contact_email || '',
      contact_phone: selectedMagazin.phone || formData.contact_phone || '',
      admin_notes: formData.admin_notes || undefined
    };
    
    console.log('Données envoyées à l\'API:', subscriptionData);
    
    this.subscriptionService.createSubscription(subscriptionData).subscribe({
      next: (response) => {
        console.log('Réponse de l\'API:', response);
        this.isLoading = false;
        this.router.navigate(['/apps/subscriptions/dashboard'], {
          queryParams: { created: true }
        });
      },
      error: (error) => {
        console.error('Erreur complète:', error);
        
        if (error.status === 422 && error.error?.errors) {
          const backendErrors = error.error.errors;
          let errorMessages: string[] = [];
          
          Object.keys(backendErrors).forEach(field => {
            if (backendErrors[field]) {
              errorMessages.push(`${field}: ${backendErrors[field].join(', ')}`);
            }
          });
          
          this.errorMessage = errorMessages.length > 0 
            ? errorMessages.join(' | ')
            : 'Erreur de validation';
        } else {
          this.errorMessage = error.error?.message || error.message || 'Erreur lors de la création de l\'abonnement';
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  } else {
    console.log('=== FORMULAIRE INVALIDE ===');
    this.displayFormErrors();
    
    this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
    
    Object.keys(this.subscriptionForm.controls).forEach(key => {
      const control = this.subscriptionForm.get(key);
      control?.markAsTouched();
    });
    
    this.cdr.detectChanges();
  }
}

displayFormErrors(): void {
  const errors: any = {};
  
  Object.keys(this.subscriptionForm.controls).forEach(key => {
    const control = this.subscriptionForm.get(key);
    if (control && control.errors) {
      errors[key] = control.errors;
    }
  });
  
  console.log('Erreurs par champ:', errors);
  console.log('Form errors object:', this.subscriptionForm.errors);
  
  // Afficher aussi les erreurs dans l'interface
  if (Object.keys(errors).length > 0) {
    this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire';
  }
}

  onCancel(): void {
    this.router.navigate(['/apps/subscriptions/dashboard']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}