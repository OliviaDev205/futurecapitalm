import { NextResponse } from "next/server";
import nodemailer from "nodemailer"; // ✅ Add this line
import UserModel from "../../../../mongodbConnect";
import { getWithdrawalConfirmationTemplate } from "../../../../lib/emailTemplates";

export async function POST(request) {
  const {
    email,
    withdrawMethod,
    withdrawalAccount,
    amount,
    transactionStatus,
  } = await request.json();

  const lowerEmail = email.toLowerCase();
  const id = crypto.randomUUID();

  try {
    // Find user
    const user = await UserModel.findOne({ email: lowerEmail });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    // Check KYC status - accept either kycStatus === "approved" OR isVerified === true
    const isKycApproved = user.kycStatus === "approved" || user.isVerified === true;
    
    if (!isKycApproved) {
      return NextResponse.json({
        success: false,
        message:
          "KYC verification required before withdrawal. Please complete KYC verification first.",
      });
    }

    // Get current date
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Calculate withdrawal fee as 10% of the withdrawal amount
    const withdrawalFee = Math.round(parseFloat(amount) * 0.1 * 100) / 100; // Round to 2 decimal places

    // Create withdrawal entry
    const withdrawalEntry = {
      id,
      dateAdded: currentDate,
      withdrawMethod,
      withdrawalAccount,
      amount,
      transactionStatus: "pending_fee", // New status for fee payment required
      withdrawalFee: withdrawalFee,
      feePaid: false,
    };

    // Push and save
    user.withdrawalHistory.push(withdrawalEntry);
    await user.save();

    // ✅ Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: "Future Capital Market <support@futurecapital-market.com>",
      to: email,
      subject:
        "Withdrawal Request - Fee Payment Required - Future Capital Market",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f1f5f9; padding: 20px 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.2;">Future Capital Market</h1>
                      <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px; line-height: 1.4;">Withdrawal Request - Fee Payment Required</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 24px 20px;">
                      <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; line-height: 1.3;">Withdrawal Fee Payment Required</h2>
                      <p style="color: #64748b; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Hello ${user.name},</p>
                      <p style="color: #64748b; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                        Your withdrawal request has been received. To process your withdrawal, please make a deposit for the required withdrawal fee.
                      </p>
                      
                      <!-- Transaction Details Card -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td align="center" style="padding-bottom: 16px;">
                                  <span style="background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block;">Fee Payment Required</span>
                                </td>
                              </tr>
                              
                              <!-- Withdrawal Amount -->
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 4px;">
                                        <span style="font-weight: 500; color: #64748b; font-size: 14px; display: block;">Withdrawal Amount</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span style="font-weight: 600; color: #1e293b; font-size: 18px; display: block;">$${amount}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              
                              <!-- Withdrawal Method -->
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 4px;">
                                        <span style="font-weight: 500; color: #64748b; font-size: 14px; display: block;">Withdrawal Method</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span style="font-weight: 600; color: #1e293b; font-size: 14px; display: block; word-break: break-word;">${withdrawMethod}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              
                              <!-- Withdrawal Fee -->
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 4px;">
                                        <span style="font-weight: 500; color: #64748b; font-size: 14px; display: block;">Withdrawal Fee (10%)</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span style="font-weight: 600; color: #dc2626; font-size: 18px; display: block;">$${withdrawalFee}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              
                              <!-- Transaction ID -->
                              <tr>
                                <td style="padding: 12px 0;">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                      <td style="padding-bottom: 4px;">
                                        <span style="font-weight: 500; color: #64748b; font-size: 14px; display: block;">Transaction ID</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span style="font-weight: 600; color: #1e293b; font-size: 13px; display: block; word-break: break-all; font-family: monospace;">${id}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Payment Notice -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; margin: 24px 0;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="font-weight: 600; color: #92400e; margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">💰 Deposit Required</p>
                            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                              Please make a deposit of <strong>$${withdrawalFee}</strong> for the withdrawal fee using the same crypto payment methods available in your dashboard. 
                              Your withdrawal will be processed once the fee payment is verified by our team.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Instructions -->
                      <p style="color: #64748b; margin: 24px 0 0 0; font-size: 16px; line-height: 1.6;">
                        You can make the fee payment through your dashboard. Once approved, your withdrawal will be processed within 1-3 business days.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8fafc; padding: 24px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">© ${new Date().getFullYear()} Future Capital Market. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't block response even if email fails
    }

    return NextResponse.json({
      success: true,
      message: user.withdrawalHistory,
      id,
      date: currentDate,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred: " + error.message,
    });
  }
}
