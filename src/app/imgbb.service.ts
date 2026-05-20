// Serviço para upload de imagens no imgbb
// Substitua 'YOUR_IMGBB_API_KEY' pela sua chave da API do imgbb
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImgbbService {
  private apiKey = typeof window !== 'undefined' ? (localStorage.getItem('imgbbKey') || '') : '';
  private endpoint = 'https://api.imgbb.com/1/upload';

  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('imgbbKey', key);
    }
  }

  async uploadImage(base64: string): Promise<string> {
    if (!this.apiKey) throw new Error('Chave do imgbb não configurada.');
    const formData = new FormData();
    formData.append('key', this.apiKey);
    formData.append('image', base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''));

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Falha ao enviar imagem para o imgbb');
    }
  }
}
