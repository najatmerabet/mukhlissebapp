import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SplashScreenService } from './splash-screen.service';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent implements OnInit {
  @ViewChild('splashScreen', { static: true }) splashScreen: ElementRef;

  constructor(private splashScreenService: SplashScreenService) {}

  ngOnInit(): void {
    this.splashScreenService.init(this.splashScreen);

    setTimeout(() => {
      this.splashScreenService.hide(500000); // 3000ms = 3 secondes d'attente
    }, 0);

  }
}
