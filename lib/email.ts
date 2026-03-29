import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM ?? "Giełda Agentów AI <noreply@gieldaagentowai.pl>";

export async function sendAgentApprovedEmail(to: string, agentName: string, agentSlug: string) {
  if (!process.env.SMTP_HOST) return; // skip if not configured
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await createTransport().sendMail({
    from: FROM,
    to,
    subject: `✅ Twój agent "${agentName}" został opublikowany`,
    text: `Cześć!\n\nTwój agent "${agentName}" przeszedł weryfikację i jest teraz widoczny w katalogu Giełdy Agentów AI.\n\nLink do agenta: ${baseUrl}/agents/${agentSlug}\n\nDziękujemy!\nZespół Giełdy Agentów AI`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#16a34a;">✅ Agent opublikowany!</h2>
        <p>Cześć!</p>
        <p>Twój agent <strong>${agentName}</strong> przeszedł weryfikację i jest teraz widoczny w katalogu Giełdy Agentów AI.</p>
        <p style="margin:24px 0;">
          <a href="${baseUrl}/agents/${agentSlug}"
             style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">
            Zobacz agenta →
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">Dziękujemy!<br/>Zespół Giełdy Agentów AI</p>
      </div>
    `,
  });
}

export async function sendAgentRejectedEmail(to: string, agentName: string, reason: string | null) {
  if (!process.env.SMTP_HOST) return;
  const reasonText = reason ? `\n\nPowód odrzucenia: ${reason}` : "";
  const reasonHtml = reason
    ? `<p><strong>Powód odrzucenia:</strong><br/><em>${reason}</em></p>`
    : "";
  await createTransport().sendMail({
    from: FROM,
    to,
    subject: `❌ Twój agent "${agentName}" wymaga poprawek`,
    text: `Cześć!\n\nNiestety Twój agent "${agentName}" nie przeszedł weryfikacji.${reasonText}\n\nPopraw agenta i wyślij go ponownie do akceptacji w panelu twórcy.\n\nZespół Giełdy Agentów AI`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#dc2626;">❌ Agent wymaga poprawek</h2>
        <p>Cześć!</p>
        <p>Niestety Twój agent <strong>${agentName}</strong> nie przeszedł weryfikacji.</p>
        ${reasonHtml}
        <p>Popraw agenta i wyślij go ponownie do akceptacji w panelu twórcy.</p>
        <p style="color:#64748b;font-size:13px;">Zespół Giełdy Agentów AI</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (!process.env.SMTP_HOST) return;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password/${token}`;
  await createTransport().sendMail({
    from: FROM,
    to,
    subject: "Reset hasła — Giełda Agentów AI",
    text: `Cześć!\n\nOtrzymaliśmy prośbę o reset hasła do Twojego konta.\n\nLink do resetu (ważny 1 godzinę):\n${resetUrl}\n\nJeśli to nie Ty wysłałeś/-aś tę prośbę, zignoruj tę wiadomość.\n\nZespół Giełdy Agentów AI`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#4f46e5;">Reset hasła</h2>
        <p>Cześć!</p>
        <p>Otrzymaliśmy prośbę o reset hasła do Twojego konta w Giełdzie Agentów AI.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}"
             style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">
            Zresetuj hasło →
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">Link wygasa po 1 godzinie.<br/>Jeśli to nie Ty wysłałeś/-aś tę prośbę, zignoruj tę wiadomość.</p>
      </div>
    `,
  });
}
