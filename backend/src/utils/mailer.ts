import nodemailer from 'nodemailer';

// Configuração do servidor de email (SMTP)
// Você deve preencher isso no .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetEmail = async (to: string, token: string) => {
  // Link que o usuário vai clicar (aponta para o Frontend)
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Gato Comics" <noreply@gatocomics.com.br>',
    to,
    subject: 'Redefinição de Senha - Gato Comics',
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetLink}" style="background-color: #8A2BE2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Redefinir Senha</a>
        <p>Se não foi você, apenas ignore este e-mail.</p>
        <p><small>Este link expira em 1 hora.</small></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};