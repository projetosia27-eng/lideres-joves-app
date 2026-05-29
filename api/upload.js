module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    
    // Se a chave não estiver configurada ou for a padrão, retornar a própria imagem em base64 como fallback
    if (!apiKey || apiKey === 'MY_IMGBB_API_KEY' || apiKey.trim() === '') {
      return res.json({ success: true, data: { url: image } });
    }

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', image.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''));

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
        const text = await response.text();
        
        // Silent fallback for invalid API key, otherwise log the error
        if (!text.includes('Invalid API v1 key')) {
          console.warn('Imgbb error:', response.status, text);
        }
        
        // Em caso de falha (ex: chave inválida), fazer fallback suave para base64
        return res.json({ success: true, data: { url: image } });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
