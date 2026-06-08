import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from './firebase';

export const authGuard = () => {
  const router = inject(Router);
  
  return new Promise<boolean>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    });
  });
};
