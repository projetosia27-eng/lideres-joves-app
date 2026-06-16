import { Injectable } from '@angular/core';

type SnackbarType = 'info' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private currentEl: HTMLElement | null = null;
  private hideTimer: any = null;

  show(message: string, duration = 3000, type: SnackbarType = 'info', action?: { label: string; callback: () => void }, sticky = false) {
    if (typeof document === 'undefined') return;

    // If an existing snackbar is visible, remove it first
    if (this.currentEl) {
      try { this.currentEl.remove(); } catch (e) { /* ignore */ }
      this.currentEl = null;
      if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    }

    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = message;

    const bg = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : 'rgba(0,0,0,0.85)';
    const padding = action ? '10px 12px' : '12px 16px';

    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: '22px',
      background: bg,
      color: '#fff',
      padding,
      borderRadius: '999px',
      zIndex: '9999',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      maxWidth: '94%',
      textAlign: 'center',
      fontSize: '14px',
      opacity: '0',
      transition: 'opacity 160ms ease-in-out, transform 160ms ease-in-out',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px'
    } as Partial<CSSStyleDeclaration>);

    if (action) {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      Object.assign(btn.style, {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
        cursor: 'pointer'
      });
      btn.onclick = (e) => {
        try { action.callback(); } catch (err) { /* ignore */ }
        this._hide(el);
      };
      el.appendChild(btn);
    }

    // Close button for sticky or always-available dismiss
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '\u2715';
    Object.assign(closeBtn.style, {
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.85)',
      fontWeight: '600',
      cursor: 'pointer',
      marginLeft: '6px'
    });
    closeBtn.onclick = () => this._hide(el);
    el.appendChild(closeBtn);

    document.body.appendChild(el);
    // keep reference
    this.currentEl = el;

    // trigger fade-in
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0px)';
    });

    // Ensure errors are visible a bit longer by default
    const effectiveDuration = type === 'error' && duration < 5000 ? 5000 : duration;

    if (!sticky) {
      this.hideTimer = setTimeout(() => this._hide(el), effectiveDuration);
    }
  }

  private _hide(el: HTMLElement) {
    try {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(6px)';
      setTimeout(() => {
        try { el.remove(); } catch (e) { /* ignore */ }
        if (this.currentEl === el) this.currentEl = null;
      }, 180);
    } catch (e) {
      try { el.remove(); } catch (e) { /* ignore */ }
      if (this.currentEl === el) this.currentEl = null;
    }
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  }
}
