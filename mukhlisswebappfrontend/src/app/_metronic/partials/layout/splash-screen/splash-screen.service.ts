import { ElementRef, Injectable } from '@angular/core';
import { animate, AnimationBuilder, style } from '@angular/animations';

@Injectable({
  providedIn: 'root',
})
export class SplashScreenService {
  // Private properties
  private el: ElementRef;
  private stopped: boolean;

  /**
   * Service constructor
   *
   * @param animationBuilder: AnimationBuilder
   */
  constructor(private animationBuilder: AnimationBuilder) {}

  /**
   * Init
   *
   * @param element: ElementRef
   */
  init(element: ElementRef) {
    this.el = element;
  }

  /**
   * Hide
   */
 hide(delayMs: number = 50000) {
    if (this.stopped || !this.el) {
      return;
    }

    const player = this.animationBuilder
      .build([style({ opacity: '1' }), animate(800, style({ opacity: '0' }))])
      .create(this.el.nativeElement);

    player.onDone(() => {
      if (typeof this.el.nativeElement.remove === 'function') {
        this.el.nativeElement.remove();
      } else {
        this.el.nativeElement.style.display = 'none !important';
      }
      this.stopped = true;
    });

    // Ici vous pouvez modifier le délai d'attente
    // Exemples :
    // 1000 = 1 seconde
    // 2000 = 2 secondes  
    // 3000 = 3 secondes (valeur par défaut)
    // 5000 = 5 secondes
    setTimeout(() => player.play(), delayMs);
  }
}
