import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddmagazinComponent } from './addmagazin.component';

describe('AddmagazinComponent', () => {
  let component: AddmagazinComponent;
  let fixture: ComponentFixture<AddmagazinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddmagazinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddmagazinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
