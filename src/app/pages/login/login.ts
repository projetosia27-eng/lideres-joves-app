import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class Login {
  router = inject(Router);
  
  email = '';
  password = '';
  errorMsg = signal('');
  isRegistering = signal(false);

  toggleMode() {
    this.isRegistering.set(!this.isRegistering());
    this.errorMsg.set('');
  }

  async login() {
    if (!this.email || !this.password) return;
    this.errorMsg.set('');
    
    try {
      await signInWithEmailAndPassword(auth, this.email, this.password);
      await this.ensureUserDocument();
      this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as unknown as { code?: string, message?: string };
        if (err.code === 'auth/invalid-credential') {
          this.errorMsg.set('Email ou senha incorretos.');
        } else {
          this.errorMsg.set(err.message || error.message);
        }
      }
    }
  }

  async register() {
    if (!this.email || !this.password) return;
    this.errorMsg.set('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
      await this.ensureUserDocument(userCredential.user);
      this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
       if (error instanceof Error) {
         const err = error as unknown as { code?: string, message?: string };
         if (err.code === 'auth/email-already-in-use') {
           this.errorMsg.set('Este email já está em uso.');
         } else if (err.code === 'auth/operation-not-allowed') {
           this.errorMsg.set('O login por Email/Senha não está habilitado no Firebase Console.');
         } else {
           this.errorMsg.set(err.message || error.message);
         }
       }
    }
  }

  async loginWithGoogle() {
    this.errorMsg.set('');
    try {
      const provider = new GoogleAuthProvider();
      // Configure popup or redirect according to your preference and constraints.
      const result = await signInWithPopup(auth, provider);
      await this.ensureUserDocument(result.user);
      this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      if (error instanceof Error) this.errorMsg.set(error.message);
    }
  }

  private async ensureUserDocument(user = auth.currentUser) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days from now
      await setDoc(userRef, {
        email: user.email,
        createdAt: serverTimestamp(),
        planType: 'trial',
        trialStartDate: now.toISOString(),
        subscriptionExpiresAt: expiresAt,
        paymentStatus: 'none',
        paymentEmail: user.email || ''
      });
    }
  }
}
