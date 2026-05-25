// Serviço para upload de imagens
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImgbbService {
  async uploadImage(base64: string): Promise<string> {
    const apiBase = typeof window !== 'undefined' ? (
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname.includes('ais-dev-') || 
       window.location.hostname.includes('ais-pre-')) ? '' : 'https://ais-pre-yloueivdghacefv3aainrn-416664334311.us-east1.run.app'
    ) : '';

    const response = await fetch(`${apiBase}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: base64 })
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error || 'Falha ao enviar imagem para o servidor.');
    }
  }
}
