// Serviço para upload de imagens
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImgbbService {
  async uploadImage(base64: string): Promise<string> {
    const response = await fetch('/api/upload', {
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
