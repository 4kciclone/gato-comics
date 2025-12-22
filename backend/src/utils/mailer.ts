import nodemailer from 'nodemailer';

const port = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: false, // Titan na porta 587 usa STARTTLS, então secure é false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Ajuda a evitar erros de certificado em VPS
  }
});

export const sendResetEmail = async (to: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://gatocomics.com.br';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Gato Comics" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Redefinição de Senha - Gato Comics',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #8A2BE2; text-align: center;">Gato Comics</h2>
        <p>Você solicitou a recuperação de senha.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #8A2BE2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p style="font-size: 12px; color: #666;">Se não foi você, ignore este e-mail.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail enviado: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail SMTP:", error);
    throw new Error("Falha no envio de e-mail");
  }
};