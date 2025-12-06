import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { PaymentController } from './controllers/paymentController';

const app = express();
const paymentController = new PaymentController();

// CONFIGURAÇÃO DE CORS MELHORADA
app.use(cors({
  // Aceita tanto localhost quanto IP local
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ROTA WEBHOOK STRIPE (RAW BODY)
app.post(
  '/api/webhook/stripe', 
  express.raw({ type: 'application/json' }), 
  (req, res) => paymentController.handleWebhook(req, res)
);

// JSON PARSER
app.use(express.json());

// LOG DE REQUESTS (Para você ver se o back está recebendo)
app.use((req, res, next) => {
  if (req.url !== '/api/webhook/stripe') {
    console.log(`[${req.method}] ${req.url}`);
  }
  next();
});

// ROTAS
app.use('/api', router);

// HEALTH CHECK
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000; 
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});