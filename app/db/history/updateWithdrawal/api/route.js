import { NextResponse } from "next/server";
import UserModel from "../../../../../mongodbConnect";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";

export async function POST(request) {
  const { email, transactionId, newStatus, amount, withdrawalAccount } =
    await request.json();

  try {
    const lowerEmail = email?.toLowerCase();
    
    if (!lowerEmail || !transactionId || !newStatus) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the user and the specific withdrawal record
    const updateObj = {
      $set: {
        "withdrawalHistory.$.transactionStatus": newStatus,
        isReadNotifications: false,
      },
    };

    if (newStatus === "success") {
      // If newStatus is "success," subtract 'amount' from tradingBalance
      updateObj.$inc = {
        totalWithdrawn: amount,
      };

      if (withdrawalAccount == "mainAccount") {
        updateObj.$inc.tradingBalance = -amount;
      } else if (withdrawalAccount == "profit") {
        updateObj.$inc.planBonus = -amount;
      } else if (withdrawalAccount == "totalWon") {
        updateObj.$inc.totalWon = -amount;
      }

      updateObj.$push = {
        notifications: {
          id: randomUUID(),
          method: "success",
          type: "transaction",
          message: `Your withdrawal of $${amount} has been successfully processed.`,
          date: Date.now(),
        },
      };
    } else if (newStatus === "failed" || newStatus === "failure") {
      // If newStatus is "failed" or "failure," push the failure notification
      updateObj.$push = {
        notifications: {
          id: randomUUID(),
          method: "failure",
          type: "transaction",
          message: `Your withdrawal of $${amount} has failed. Please contact Customer Support.`,
          date: Date.now(),
        },
      };
    }

    // Find user first to get withdrawal details
    const user = await UserModel.findOne({ email: lowerEmail });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Find the withdrawal record to get all details
    const withdrawal = user.withdrawalHistory.find((w) => w.id === transactionId);
    
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: "Withdrawal record not found" },
        { status: 404 }
      );
    }

    // Update the withdrawal status
    const updatedUser = await UserModel.findOneAndUpdate(
      { email: lowerEmail, "withdrawalHistory.id": transactionId },
      updateObj,
      {
        new: true, // Return the updated document
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update withdrawal status" },
        { status: 500 }
      );
    }

    // Send withdrawal confirmation email if status is "success"
    if (newStatus === "success") {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.hostinger.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const withdrawalDetails = {
          amount: withdrawal.amount,
          method: withdrawal.withdrawMethod || "N/A",
          account: withdrawal.withdrawalAccount || "N/A",
          transactionId: transactionId,
          dateAdded: withdrawal.dateAdded || new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        };

        const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Approved - Future Capital Market</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            color: rgba(255, 255, 255, 0.9);
            margin: 8px 0 0 0;
            font-size: 14px;
        }
        .content {
            padding: 32px 24px;
        }
        .greeting {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 24px;
        }
        .message-box {
            background: #d1fae5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .message-box h2 {
            color: #065f46;
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
        }
        .message-box p {
            color: #065f46;
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
        }
        .details-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .details-card h3 {
            color: #1e293b;
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
        }
        .detail-value {
            color: #1e293b;
            font-size: 14px;
            font-weight: 600;
        }
        .amount {
            font-size: 32px;
            font-weight: 700;
            color: #059669;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Future Capital Market</h1>
            <p>Withdrawal Approved</p>
        </div>
        <div class="content">
            <p class="greeting">Hello ${user.name},</p>
            
            <div class="message-box">
                <h2>Your funds are on the way</h2>
                <p>
                    Good news! We've approved your withdrawal request and sent the funds from your Future capital Balance to the Destination wallet address you have provided.
                </p>
                <p style="margin-top: 12px;">
                    Please note: your funds may take up to 5-10 minutes to arrive in your wallet. We appreciate your patience with this processing time.
                </p>
            </div>

            <div class="details-card">
                <h3>Withdrawal Details</h3>
                <div class="amount">$${parseFloat(withdrawalDetails.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                
                <div class="detail-row">
                    <span class="detail-label">Transaction ID</span>
                    <span class="detail-value">${withdrawalDetails.transactionId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Withdrawal Method</span>
                    <span class="detail-value">${withdrawalDetails.method}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Account Type</span>
                    <span class="detail-value">${withdrawalDetails.account}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${withdrawalDetails.dateAdded}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value" style="color: #059669;">Completed</span>
                </div>
            </div>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Future Capital Market. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        await transporter.sendMail({
          from: "Future Capital Market <support@futurecapital-market.com>",
          to: email,
          subject: "Withdrawal Approved - Your Funds Are On The Way",
          html: emailContent,
        });
      } catch (emailError) {
        console.error("Error sending withdrawal confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transaction status updated successfully",
    });
  } catch (error) {
    console.error("Error while updating transaction status:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
