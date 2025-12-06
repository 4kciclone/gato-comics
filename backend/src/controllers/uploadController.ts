import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 1. Configuração do Multer (Armazenamento em Memória)
// Usamos memoryStorage para pegar o buffer do arquivo e enviar direto para a nuvem
// sem salvar no disco do servidor.
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de segurança: 10MB por arquivo
});

// 2. Configuração do Cliente S3 (Cloudflare R2)
// O R2 usa a mesma API do S3 da Amazon.
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export class UploadController {
  
  // Middleware do Multer para ser usado na rota (router.post(..., UploadController.uploadMiddleware, ...))
  static uploadMiddleware = upload.single('file');

  async uploadFile(req: Request, res: Response) {
    try {
      // Validação básica
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // Verificação de segurança (Opcional: checar se as chaves existem)
      if (!process.env.R2_BUCKET_NAME || !process.env.R2_ACCOUNT_ID) {
        console.error("ERRO: Variáveis de ambiente do R2 não configuradas.");
        return res.status(500).json({ error: 'Erro de configuração do servidor (R2)' });
      }

      // 3. Gerar nome único para o arquivo
      // Ex: 1715000000-123456.jpg
      const fileExtension = path.extname(req.file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
      
      // 4. Preparar o comando de upload
      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueName, // Nome do arquivo no bucket
        Body: req.file.buffer, // O arquivo em si (bits)
        ContentType: req.file.mimetype,
        // ACL: 'public-read' // Geralmente não necessário no R2 se o bucket for público
      };

      // 5. Enviar para a nuvem
      await r2.send(new PutObjectCommand(uploadParams));

      // 6. Gerar a URL Pública
      // Se você configurou um domínio customizado no Cloudflare, coloque em R2_PUBLIC_URL
      // Senão, usa o padrão .r2.dev (se estiver habilitado no painel)
      const baseUrl = process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.r2.dev`;
      const publicUrl = `${baseUrl}/${uniqueName}`;

      return res.json({ url: publicUrl });

    } catch (error) {
      console.error("Erro no upload R2:", error);
      return res.status(500).json({ error: 'Falha ao fazer upload para a nuvem' });
    }
  }
}