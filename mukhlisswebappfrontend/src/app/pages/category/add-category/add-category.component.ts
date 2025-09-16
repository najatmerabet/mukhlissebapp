import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../category.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit {
  categoryForm: FormGroup; // Déclaration sans "!" pour éviter l'erreur
  isSubmitting = false;
  categoryyId: any; // Pour stocker l'ID de la catégorie en mode édition
  isEditMode = false; // Nouvelle variable pour suivre le mode

  constructor(
    private fb: FormBuilder, 
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute, 
    private cdr: ChangeDetectorRef
  ) {
    // Initialisation du formulaire dans le constructeur
    this.categoryForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      nameFr: ['', Validators.required],
      nameAr: ['', Validators.required],
      nameEn: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.categoryyId = this.route.snapshot.paramMap.get('id');
    
    if (this.categoryyId) {
      console.log('Edit mode for category ID:', this.categoryyId);
      this.isEditMode = true;
      this.getCategoryById(this.categoryyId);
    }
    
    this.cdr.detectChanges();
  }

  onBack(): void {
    this.router.navigate(['/categories']);
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    
    if (this.isEditMode) {
      // Mode édition
      this.categoryService.updateCategory(this.categoryForm.value).subscribe({
        next:(res)=>{
          console.log('Catégorie mise à jour avec succès', res);
          this.isSubmitting = false;
          this.categoryForm.reset();
          
        },
        error:(err)=>{
          console.error('Erreur lors de la mise à jour de la catégorie', err);
          this.isSubmitting = false;
        }
      });

    } else {
      // Mode création
      this.categoryService.addCategory(this.categoryForm.value).subscribe({
        next: (res) => {
          console.log('Catégorie créée avec succès', res);
          this.isSubmitting = false;
          this.categoryForm.reset();
          
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout de la catégorie', err);
          this.isSubmitting = false;
        }
      });
    }
  }

  getCategoryById(id: number): void {
    this.categoryService.getCategoryById(id).subscribe({
      next: (res) => {
        console.log('Catégorie récupérée avec succès', res);
        this.categoryForm.patchValue({
          id: res.id,
          name: res.name,
          nameFr: res.nameFr,
          nameAr: res.nameAr,
          nameEn: res.nameEn
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la catégorie', err);
      }
    });
  }
}