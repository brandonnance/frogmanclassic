interface SponsorWelcomeData {
  sponsorName: string;
  contactName: string;
  packageName: string;
  packagePrice: number;
  includedEntries: number;
  benefits: string[];
  paymentMethod: string;
  editUrl: string;
}

interface CaptainCodeData {
  sponsorName: string;
  code: string;
  redeemUrl: string;
}

interface TeamConfirmationData {
  teamName: string;
  captainName: string;
  eventType: string;
  sponsorName?: string | null;
  playerNames: string[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}


export function sponsorWelcomeEmail(data: SponsorWelcomeData): {
  subject: string;
  html: string;
} {
  const benefitsHtml = data.benefits
    .map((benefit) => `<li style="padding: 4px 0;">${benefit}</li>`)
    .join("");

  const entriesSection =
    data.includedEntries > 0
      ? `
      <h2 style="color: #166534; margin-top: 32px;">Team Entry Management</h2>
      <p>Your package includes ${data.includedEntries} team ${data.includedEntries === 1 ? "entry" : "entries"}. You can manage your team entries, send invite links to team captains, or share registration links directly through your sponsorship portal:</p>

      <a href="${data.editUrl}" style="display: inline-block; background: #166534; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">Manage Team Entries</a>

      <p style="font-size: 14px; color: #666;">Save this link - you'll use it to send invites to your team captains when ready.</p>
    `
      : "";

  const paymentSection = `
      <h2 style="color: #166534; margin-top: 32px;">Payment</h2>
      <p>Additional payment options are coming soon. If you need to pay now, checks are accepted:</p>
      <p style="margin-left: 16px;">
        <strong>Check:</strong> Make payable to "Frogman Classic"<br>
        <span style="color: #666; font-size: 14px;">Please include "${data.sponsorName}" in the memo.</span>
      </p>
      <p style="font-size: 14px; color: #666;">We'll reach out with more payment options shortly.</p>
    `;

  return {
    subject: `Thank You for Your Frogman Classic 2026 Sponsorship`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #166534; margin: 0;">Frogman Classic 2026</h1>
    <p style="color: #666; margin-top: 8px;">Thank you for your sponsorship!</p>
  </div>

  <p>Dear ${data.contactName},</p>

  <p>Thank you for registering <strong>${data.sponsorName}</strong> as a sponsor for the Frogman Classic 2026. Your support helps veterans and we're honored to have you.</p>

  <h2 style="color: #166534; margin-top: 32px;">Your Sponsorship Package</h2>
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 16px 0;">
    <p style="font-size: 18px; margin-bottom: 16px; color: #166534;">
      <span style="font-weight: 600;">${data.packageName}</span> &mdash; <span style="font-weight: 700;">${formatPrice(data.packagePrice)}</span>
    </p>
    <p style="font-weight: 600; color: #166534; margin-bottom: 8px;">What's included:</p>
    <ul style="margin: 0; padding-left: 20px; color: #166534;">
      ${benefitsHtml}
    </ul>
  </div>

  ${entriesSection}

  ${paymentSection}

  <h2 style="color: #166534; margin-top: 32px;">Questions?</h2>
  <p>Reply to this email or contact us at <a href="mailto:info@frogmanclassic.com" style="color: #166534;">info@frogmanclassic.com</a>.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Frogman Classic - Supporting Veterans
  </p>
</body>
</html>
    `,
  };
}

export function captainCodeEmail(data: CaptainCodeData): {
  subject: string;
  html: string;
} {
  return {
    subject: `Your Frogman Classic 2026 Team Registration Link`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #166534; margin: 0;">Frogman Classic 2026</h1>
    <p style="color: #666; margin-top: 8px;">Team Registration</p>
  </div>

  <p>You've been invited to register a team for the Frogman Classic 2026, sponsored by <strong>${data.sponsorName}</strong>.</p>

  <p>Click the button below to register your team:</p>

  <a href="${data.redeemUrl}" style="display: block; background: #166534; color: white; padding: 16px 24px; border-radius: 6px; text-decoration: none; text-align: center; margin: 24px 0; font-size: 18px;">Register Your Team</a>

  <h2 style="color: #166534; margin-top: 32px;">What You'll Need</h2>
  <ul>
    <li>Team name (optional)</li>
    <li>Player names and contact info</li>
    <li>GHIN numbers (Friday: optional, Saturday/Sunday: required)</li>
    <li>Session preference (AM/PM/Any)</li>
  </ul>

  <p style="margin-top: 24px; padding: 12px 16px; background: #fef3c7; border-radius: 6px; font-size: 14px;">
    <strong>Note:</strong> This link can only be used once. Team entries can be used for the Friday Florida Scramble OR the Saturday/Sunday 2-man Best Ball.
  </p>

  <p style="margin-top: 32px; color: #666; font-size: 14px;">
    Questions? Contact your sponsor or reach out to Drew Goodman (drew@gameincgc.com).
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Frogman Classic - Supporting Veterans
  </p>
</body>
</html>
    `,
  };
}

export function teamConfirmationEmail(data: TeamConfirmationData): {
  subject: string;
  html: string;
} {
  const eventLabel =
    data.eventType === "friday" ? "Friday Event" : "Saturday/Sunday Event";
  const isFriday = data.eventType === "friday";

  // For Friday, mention team name. For Sat/Sun, just say "You have been registered"
  const introLine = isFriday
    ? `Your team <strong>${data.teamName}</strong> has been successfully registered for the Frogman Classic 2026.`
    : `You have been successfully registered for the Frogman Classic 2026.`;

  // Only show sponsor row if there's actually a sponsor
  const sponsorRow = data.sponsorName
    ? `<tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #666;">Sponsor</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.sponsorName}</td>
    </tr>`
    : "";

  // Format player names list
  const playersRow = data.playerNames && data.playerNames.length > 0
    ? `<tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #666;">Players</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.playerNames.join(", ")}</td>
    </tr>`
    : "";

  return {
    subject: `Team Registration Confirmed - Frogman Classic 2026`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #166534; margin: 0;">Frogman Classic 2026</h1>
    <p style="color: #666; margin-top: 8px;">Registration Confirmed!</p>
  </div>

  <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
    <p style="font-size: 18px; color: #166534; margin: 0;">Your team is registered!</p>
  </div>

  <p>Dear ${data.captainName},</p>

  <p>${introLine}</p>

  <h2 style="color: #166534; margin-top: 32px;">Registration Details</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #666;">Team Name</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.teamName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #666;">Event</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${eventLabel}</td>
    </tr>
    ${playersRow}
    ${sponsorRow}
  </table>

  <h2 style="color: #166534; margin-top: 32px;">What's Next</h2>
  <ul>
    <li>Tee times will be assigned closer to the event date</li>
    <li>You'll receive an email with your tee time and additional instructions</li>
    <li>If there are any changes to a player's GHIN, please let the tournament director know ASAP</li>
  </ul>

  <p style="margin-top: 32px; color: #666; font-size: 14px;">
    Questions or changes? Contact Drew Goodman at <a href="mailto:drew@gameincgc.com" style="color: #166534;">drew@gameincgc.com</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Frogman Classic - Supporting Navy SEAL Families
  </p>
</body>
</html>
    `,
  };
}
