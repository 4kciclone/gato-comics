import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { PaymentController } from './controllers/paymentController';

const app = express();
const paymentController = new PaymentController();

// ==========================================
// 1. CONFIGURAÇÃO DE SEGURANÇA (CORS)
// ==========================================
app.use(cors({
  origin: [
    'http://localhost:3000',           // Desenvolvimento Local
    'http://127.0.0.1:3000',           // Desenvolvimento Local IP
    'https://gatocomics.com.br',       // Produção (Seu Domínio)
    'https://www.gatocomics.com.br',   // Produção WWW
    'https://gato-comics.vercel.app',  // Vercel Default
    process.env.FRONTEND_URL || ''     // Variável do .env (Fallback dinâmico)
  ].filter(Boolean), // Remove entradas vazias/nulas
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// 2. WEBHOOK STRIPE (CASO ESPECIAL)
// ==========================================
// Precisa vir ANTES do express.json() porque o Stripe exige 
// o corpo da requisição em formato RAW (Buffer) para validar a assinatura.
app.post(
  '/api/webhook/stripe', 
  express.raw({ type: 'application/json' }), 
  (req, res) => paymentController.handleWebhook(req, res)
);

// ==========================================
// 3. MIDDLEWARES GERAIS
// ==========================================
app.use(express.json());

// Log de Requisições (Com Horário para Debug na VPS)
app.use((req, res, next) => {
  if (req.url !== '/api/webhook/stripe') {
    // Ex: [2023-12-25T10:00:00.000Z] GET /api/works
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// ==========================================
// 4. ROTAS
// ==========================================
app.use('/api', router);

// Rota de Saúde (Health Check)
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ==========================================
// 5. INICIALIZAÇÃO
// ==========================================
const PORT = process.env.PORT || 4000; 

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});