interface SponsorWelcomeData {
  sponsorName: string
  contactName: string
  packageName: string
  packagePrice: number
  includedEntries: number
  benefits: string[]
  paymentMethod: string
  editUrl: string
}

interface CaptainCodeData {
  sponsorName: string
  code: string
  redeemUrl: string
}

interface TeamConfirmationData {
  teamName: string
  captainName: string
  eventType: string
  sponsorName: string
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function getPaymentLabel(method: string): string {
  switch (method) {
    case 'online': return 'Online Payment (coming soon)'
    case 'check': return 'Check'
    case 'invoice': return 'Invoice / ACH'
    case 'venmo': return 'Venmo'
    case 'paypal': return 'PayPal'
    default: return method
  }
}

export function sponsorWelcomeEmail(data: SponsorWelcomeData): { subject: string; html: string } {
  const benefitsHtml = data.benefits
    .map(benefit => `<li style="padding: 4px 0;">${benefit}</li>`)
    .join('')

  const entriesSection = data.includedEntries > 0
    ? `
      <h2 style="color: #166534; margin-top: 32px;">Team Entry Management</h2>
      <p>Your package includes ${data.includedEntries} team ${data.includedEntries === 1 ? 'entry' : 'entries'}. You can manage your team entries, send invite links to team captains, or share registration links directly through your sponsorship portal:</p>

      <a href="${data.editUrl}" style="display: inline-block; background: #166534; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">Manage Team Entries</a>

      <p style="font-size: 14px; color: #666;">Save this link - you'll use it to send invites to your team captains when ready.</p>
    `
    : ''

  const paymentSection = data.paymentMethod === 'online'
    ? `
      <h2 style="color: #166534; margin-top: 32px;">Payment</h2>
      <p>You selected online payment. This option will be available soon - we'll send you a payment link when it's ready.</p>
    `
    : `
      <h2 style="color: #166534; margin-top: 32px;">Payment</h2>
      <p>You selected <strong>${getPaymentLabel(data.paymentMethod)}</strong> as your payment method.</p>
      <p>Please use one of the following options to complete your payment:</p>
      <ul>
        <li><strong>Check:</strong> Make payable to "Frogman Classic" and mail to [Address]</li>
        <li><strong>Venmo:</strong> @FrogmanClassic</li>
        <li><strong>PayPal:</strong> payments@frogmanclassic.com</li>
        <li><strong>ACH/Invoice:</strong> Contact us and we'll send an invoice</li>
      </ul>
      <p style="font-size: 14px; color: #666;">Please include "${data.sponsorName}" in your payment memo.</p>
    `

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

  <p>Thank you for registering <strong>${data.sponsorName}</strong> as a sponsor for the Frogman Classic 2026. Your support helps Navy SEAL families and we're honored to have you.</p>

  <h2 style="color: #166534; margin-top: 32px;">Your Sponsorship Package</h2>
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 16px 0;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <span style="font-size: 18px; font-weight: 600; color: #166534;">${data.packageName}</span>
      <span style="font-size: 18px; font-weight: 700; color: #166534;">${formatPrice(data.packagePrice)}</span>
    </div>
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
    Frogman Classic - Supporting Navy SEAL Families
  </p>
</body>
</html>
    `
  }
}

export function captainCodeEmail(data: CaptainCodeData): { subject: string; html: string } {
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
    <li>Player names and contact info (up to 4 players)</li>
    <li>GHIN numbers (if available)</li>
    <li>Event preference (Friday or Saturday/Sunday)</li>
    <li>Session preference (AM or PM)</li>
  </ul>

  <p style="margin-top: 24px; padding: 12px 16px; background: #fef3c7; border-radius: 6px; font-size: 14px;">
    <strong>Note:</strong> This link can only be used once. Team entries can be used for the Friday event OR the Saturday/Sunday event.
  </p>

  <p style="margin-top: 32px; color: #666; font-size: 14px;">
    Questions? Contact your sponsor or reply to this email.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Frogman Classic - Supporting Navy SEAL Families
  </p>
</body>
</html>
    `
  }
}

export function teamConfirmationEmail(data: TeamConfirmationData): { subject: string; html: string } {
  const eventLabel = data.eventType === 'friday' ? 'Friday Event' : 'Saturday/Sunday Event'

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

  <p>Your team <strong>${data.teamName}</strong> has been successfully registered for the Frogman Classic 2026.</p>

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
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #666;">Sponsor</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.sponsorName}</td>
    </tr>
  </table>

  <h2 style="color: #166534; margin-top: 32px;">What's Next</h2>
  <ul>
    <li>Tee times will be assigned closer to the event date</li>
    <li>You'll receive an email with your tee time and additional instructions</li>
    <li>Make sure your players have their GHIN numbers ready</li>
  </ul>

  <p style="margin-top: 32px; color: #666; font-size: 14px;">
    Questions? Reply to this email and we'll help you out.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

  <p style="color: #999; font-size: 12px; text-align: center;">
    Frogman Classic - Supporting Navy SEAL Families
  </p>
</body>
</html>
    `
  }
}
