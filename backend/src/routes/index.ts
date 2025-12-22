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
import { AdsController } from '../controllers/adsController';

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
const adsController = new AdsController();

console.log('--- 🚀 Rotas Carregadas e Protegidas ---');

// ==================================================
// 🔓 ROTAS PÚBLICAS (Acesso Livre)
// ==================================================

// Autenticação
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/forgot-password', authController.forgotPassword); // <--- NOVA
router.post('/auth/reset-password', authController.resetPassword);   // <--- NOVA

// Leitura
router.get('/works/featured', workController.getFeatured); 
router.get('/works/ranking', workController.getRanking);
router.get('/works', workController.list);
router.post('/works/:id/view', workController.registerView);
router.get('/works/:id', workController.show);
router.get('/comments', commentController.list);

// Vitrine
router.get('/shop/packs', shopController.listPacks);
router.get('/plans', planController.list);
router.get('/shop/items', cosmeticController.listStore);


// ==================================================
// 👤 ROTAS DO USUÁRIO (Requer Login)
// ==================================================

// Perfil e Interação
router.get('/auth/profile', authMiddleware, authController.getProfile);
router.get('/auth/inventory', authMiddleware, cosmeticController.getInventory);
router.post('/auth/inventory/equip', authMiddleware, cosmeticController.equip);
router.get('/works/:id/interaction', authMiddleware, workController.getUserInteraction);
router.post('/works/:id/interaction', authMiddleware, workController.updateInteraction);
router.post('/comments', authMiddleware, commentController.create);
router.post('/ads/watch', authMiddleware, adsController.watchAd);

// Leitor Seguro e Pagamentos
router.get('/chapters/:id/content', authMiddleware, chapterController.getContent);
router.post('/chapters/:id/unlock', authMiddleware, chapterController.unlock);
router.post('/shop/checkout', authMiddleware, (req, res) => paymentController.createCheckoutSession(req, res));
router.post('/shop/items/buy', authMiddleware, cosmeticController.buy);


// ==================================================
// 🎨 ROTAS DE CRIADOR (Uploader / Admin / Owner)
// ==================================================

// Obras e Capítulos
router.post('/works', authMiddleware, uploaderMiddleware, workController.create);
router.put('/works/:id', authMiddleware, uploaderMiddleware, workController.update);
router.delete('/works/:id', authMiddleware, uploaderMiddleware, workController.delete);
router.post('/works/:workId/chapters', authMiddleware, uploaderMiddleware, chapterController.create);
router.delete('/chapters/:id', authMiddleware, uploaderMiddleware, chapterController.delete);

// Upload
router.post('/upload', 
  authMiddleware, 
  uploaderMiddleware, 
  UploadController.uploadMiddleware, 
  uploadController.uploadFile
);


// ==================================================
// 👑 ROTAS DE ADMINISTRAÇÃO (Admin / Owner)
// ==================================================

router.get('/admin/users', authMiddleware, adminMiddleware, adminController.listUsers);
router.put('/admin/users/:id', authMiddleware, adminMiddleware, adminController.updateUser);
router.get('/admin/finance', authMiddleware, adminMiddleware, adminController.getFinance);
router.get('/admin/stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/admin/settings', authMiddleware, adminMiddleware, settingsController.list);
router.put('/admin/settings', authMiddleware, adminMiddleware, settingsController.update);
router.post('/admin/items', authMiddleware, adminMiddleware, cosmeticController.create);

export { router };