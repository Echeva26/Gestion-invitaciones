// Envía un email al revisor humano avisando de que el agente ha abierto un PR
// con una propuesta de arreglo. Se ejecuta en el workflow auto-fix.yml.
//
// Lee la configuración SMTP de las variables de entorno (secrets de GitHub) y
// el resumen del agente de /tmp/agent-summary.txt.
import nodemailer from "nodemailer";
import { readFileSync } from "node:fs";

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  PR_URL,
  ISSUE_NUMBER,
  NOTIFY_EMAIL,
} = process.env;

if (!SMTP_HOST) {
  console.log("Sin SMTP_HOST: no se envía email (se omite).");
  process.exit(0);
}

let summary = "(sin resumen)";
try {
  summary = readFileSync("/tmp/agent-summary.txt", "utf8").trim().slice(-6000) || summary;
} catch {
  /* sin fichero de resumen */
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const to = NOTIFY_EMAIL || "jorge.echevarria.uri@gmail.com";

await transporter.sendMail({
  from: SMTP_FROM ?? "Abedul Piscina <no-reply@abedul.example>",
  to,
  subject: `🤖 Propuesta de arreglo lista para revisar · issue #${ISSUE_NUMBER ?? "?"}`,
  text:
    `El agente ha detectado un bug en producción y propone un arreglo.\n\n` +
    `RESUMEN:\n${summary}\n\n` +
    `Revisa y aprueba el Pull Request aquí:\n${PR_URL}\n\n` +
    `Nada se desplegará hasta que apruebes. Al hacer merge, el pipeline pedirá ` +
    `además tu aprobación final antes de publicar en producción.`,
  html: `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#0d9488">🤖 Propuesta de arreglo lista para revisar</h2>
      <p>El agente ha detectado un bug en producción (issue #${ISSUE_NUMBER ?? "?"}) y propone un arreglo.</p>
      <h3>Resumen del agente</h3>
      <pre style="white-space:pre-wrap;background:#f1f5f9;padding:12px;border-radius:8px;font-size:13px">${escapeHtml(summary)}</pre>
      <p style="margin:24px 0">
        <a href="${PR_URL}" style="background:#0d9488;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
          Revisar el Pull Request
        </a>
      </p>
      <p style="color:#666;font-size:13px">
        Nada se desplegará hasta que apruebes. Al hacer merge, el pipeline pedirá
        además tu aprobación final antes de publicar en producción.
      </p>
    </div>`,
});

console.log(`Email de verificación enviado a ${to}.`);

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
