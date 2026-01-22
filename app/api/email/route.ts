import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sponsorWelcomeEmail, captainCodeEmail, teamConfirmationEmail } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Frogman Classic <noreply@frogmanclassic.com>'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    if (!type || !to || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to, data' },
        { status: 400 }
      )
    }

    let emailContent: { subject: string; html: string }

    switch (type) {
      case 'sponsor_welcome':
        emailContent = sponsorWelcomeEmail(data)
        break
      case 'captain_code':
        emailContent = captainCodeEmail(data)
        break
      case 'team_confirmation':
        emailContent = teamConfirmationEmail(data)
        break
      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'xxx') {
      console.log('Resend API key not configured, skipping email send')
      console.log('Would send email:', { to, subject: emailContent.subject })
      return NextResponse.json({
        success: true,
        message: 'Email skipped (API key not configured)',
        preview: { to, subject: emailContent.subject }
      })
    }

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: emailData?.id
    })
  } catch (error) {
    console.error('Email route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
