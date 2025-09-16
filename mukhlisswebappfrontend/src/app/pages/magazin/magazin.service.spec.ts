import { TestBed } from '@angular/core/testing';

import { MagazinService } from './magazin.service';

describe('MagazinService', () => {
  let service: MagazinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MagazinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
