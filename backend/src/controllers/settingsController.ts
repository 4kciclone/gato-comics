import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsController {
  
  // 1. OBTER TODAS AS CONFIGURAÇÕES
  async list(req: Request, res: Response) {
    try {
      const configs = await prisma.systemConfig.findMany();
      
      // Transforma array [{key: 'a', value: '1'}] em objeto {a: '1'} para o frontend
      const configMap: any = {};
      configs.forEach(conf => {
        // Se for booleano (true/false), converte
        if (conf.value === 'true') configMap[conf.key] = true;
        else if (conf.value === 'false') configMap[conf.key] = false;
        else configMap[conf.key] = conf.value;
      });

      return res.json(configMap);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  }

  // 2. SALVAR CONFIGURAÇÕES (UPSERT)
  async update(req: Request, res: Response) {
    try {
      const settings = req.body; // Recebe { siteName: "Gato", maintenance: true ... }

      // Itera sobre cada chave enviada e salva no banco
      const promises = Object.keys(settings).map(key => {
        return prisma.systemConfig.upsert({
          where: { key },
          update: { value: String(settings[key]) }, // Converte tudo pra string
          create: { key, value: String(settings[key]) }
        });
      });

      await Promise.all(promises);

      return res.json({ success: true, message: 'Configurações salvas' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  }
}