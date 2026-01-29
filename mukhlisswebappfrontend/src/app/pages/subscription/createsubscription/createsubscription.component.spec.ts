import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatesubscriptionComponent } from './createsubscription.component';

describe('CreatesubscriptionComponent', () => {
  let component: CreatesubscriptionComponent;
  let fixture: ComponentFixture<CreatesubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatesubscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatesubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
