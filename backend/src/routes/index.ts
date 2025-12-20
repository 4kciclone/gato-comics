import { Router } from 'express';

// --- IMPORTAÇÃO DOS CONTROLLERS ---
import { AuthController } from '../controllers/authController';
import { WorkController } from '../controllers/workController';
import { ChapterController } from '../controllers/chapterController';
import { ShopController } from '../controllers/shopController';
import { AdminController } from '../controllers/adminController';
import { UploadController } from '../controllers/uploadController';
import { SettingsController } from '../controllers/settingsController';
import { PlanController } from '../controllers/planController';
import { PaymentController } from '../controllers/paymentController'; 
import { CosmeticController } from '../controllers/cosmeticController';
import { CommentController } from '../controllers/commentController';
import { AdsController } from '../controllers/adsController'; // <--- ADICIONADO AQUI


// --- IMPORTAÇÃO DOS MIDDLEWARES ---
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware, uploaderMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// --- INSTÂNCIAS ---
const authController = new AuthController();
const workController = new WorkController();
const chapterController = new ChapterController();
const shopController = new ShopController();
const adminController = new AdminController();
const uploadController = new UploadController();
const settingsController = new SettingsController();
const planController = new PlanController();
const paymentController = new PaymentController(); 
const cosmeticController = new CosmeticController();
const commentController = new CommentController();
const adsController = new AdsController(); // <--- ADICIONADO AQUI



console.log('--- 🚀 Rotas Carregadas e Protegidas ---');

// ==================================================
// 🔓 ROTAS PÚBLICAS (Acesso Livre)
// ==================================================

// Autenticação
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// Leitura
router.get('/works/featured', workController.getFeatured); 
router.get('/works/ranking', workController.getRanking);
router.get('/works', workController.list);
router.post('/works/:id/view', workController.registerView);
router.get('/works/:id', workController.show);

// Vitrine
router.get('/shop/packs', shopController.listPacks);
router.get('/plans', planController.list);

router.get('/shop/items', cosmeticController.listStore); // Ver itens
router.post('/shop/items/buy', authMiddleware, cosmeticController.buy); // Comprar

router.get('/comments', commentController.list); // Pública
router.post('/comments', authMiddleware, commentController.create); // Protegida

// ==================================================
// 👤 ROTAS DO USUÁRIO (Requer Login)
// ==================================================

// Perfil
router.get('/auth/profile', authMiddleware, authController.getProfile);

// Leitor Seguro
router.get('/chapters/:id/content', authMiddleware, chapterController.getContent);

// Transações
router.post('/chapters/:id/unlock', authMiddleware, chapterController.unlock);

// PAGAMENTO (STRIPE)
router.post('/shop/checkout', authMiddleware, (req, res) => paymentController.createCheckoutSession(req, res));
router.get('/auth/inventory', authMiddleware, cosmeticController.getInventory);
router.post('/auth/inventory/equip', authMiddleware, cosmeticController.equip);

// Interação com Obra (Like, Rate, Status)
router.get('/works/:id/interaction', authMiddleware, workController.getUserInteraction);
router.post('/works/:id/interaction', authMiddleware, workController.updateInteraction);

// Ads (Patinhas Lite)
router.post('/ads/watch', authMiddleware, adsController.watchAd); // <--- AGORA FUNCIONA

// ==================================================
// 🎨 ROTAS DE CRIADOR (Uploader / Admin / Owner)
// ==================================================

// Obras
router.post('/works', authMiddleware, uploaderMiddleware, workController.create);
router.put('/works/:id', authMiddleware, uploaderMiddleware, workController.update);
router.delete('/works/:id', authMiddleware, uploaderMiddleware, workController.delete);

// Capítulos
router.post('/works/:workId/chapters', authMiddleware, uploaderMiddleware, chapterController.create);
router.delete('/chapters/:id', authMiddleware, uploaderMiddleware, chapterController.delete);

// Upload de Imagens
router.post('/upload', 
  authMiddleware, 
  uploaderMiddleware, 
  UploadController.uploadMiddleware, 
  uploadController.uploadFile
);


// ==================================================
// 👑 ROTAS DE ADMINISTRAÇÃO (Admin / Owner)
// ==================================================

// Gestão de Usuários
router.get('/admin/users', authMiddleware, adminMiddleware, adminController.listUsers);
router.put('/admin/users/:id', authMiddleware, adminMiddleware, adminController.updateUser);

// Finanças e Stats
router.get('/admin/finance', authMiddleware, adminMiddleware, adminController.getFinance);
router.get('/admin/stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);

// Configurações do Sistema
router.get('/admin/settings', authMiddleware, adminMiddleware, settingsController.list);
router.put('/admin/settings', authMiddleware, adminMiddleware, settingsController.update);

router.post('/admin/items', authMiddleware, adminMiddleware, cosmeticController.create);

export { router };