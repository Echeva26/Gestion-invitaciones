import nodemailer from "nodemailer";

/**
 * Envía el enlace mágico de acceso.
 *
 * Si no hay SMTP_HOST configurado (típico en desarrollo), en lugar de enviar
 * el correo se imprime el enlace en la consola del servidor. Así se puede
 * probar el flujo completo sin un servidor de correo.
 */
export async function sendMagicLink(to: string, link: string): Promise<void> {
  const host = process.env.SMTP_HOST;

  if (!host) {
    console.log("\n──────────── ENLACE MÁGICO (modo desarrollo) ────────────");
    console.log(`  Para: ${to}`);
    console.log(`  Enlace: ${link}`);
    console.log("──────────────────────────────────────────────────────────\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Piscina Abedul <no-reply@abedul.example>",
    to,
    subject: "Tu acceso a la piscina · Comunidad Abedul",
    text: `Accede a la gestión de invitados de la piscina con este enlace (caduca en 15 minutos):\n\n${link}\n\nSi no has solicitado este acceso, ignora este correo.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0d9488">Acceso a la piscina · Comunidad Abedul</h2>
        <p>Pulsa el botón para gestionar tus invitados. El enlace caduca en 15 minutos.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#0d9488;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
            Entrar
          </a>
        </p>
        <p style="color:#666;font-size:13px">Si no has solicitado este acceso, ignora este correo.</p>
      </div>`,
  });
}
