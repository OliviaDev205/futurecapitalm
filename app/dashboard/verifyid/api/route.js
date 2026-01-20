import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getIDVerificationTemplate } from "../../../../lib/emailTemplates";
import UserModel from "../../../../mongodbConnect";

export async function POST(request) {
  const { formData, frontIDSecureUrl, backIDSecureUrl, email, idType } =
    await request.json();

  try {
    // Get KYC fee from admin settings
    const adminSettings = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/db/adminSettings/api`
    );
    const settings = await adminSettings.json();
    const kycFee = settings.kycFee || 25;

    // Save KYC data to database
    const kycData = {
      personalDetails: {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        addressLine1: formData.addressLine1 || "",
        addressLine2: formData.addressLine2 || "",
        city: formData.city || "",
        stateProvince: formData.stateProvince || "",
        country: formData.country || "",
        zipCode: formData.zipCode || "",
        phone: formData.phone || "",
        secondPhone: formData.secondPhone || "",
      },
      idType: idType || "",
      frontIDUrl: frontIDSecureUrl || "",
      backIDUrl: backIDSecureUrl || "",
      submittedAt: new Date(),
    };

    // Update user with KYC data, fee, and status
    await UserModel.updateOne(
      { email: email.toLowerCase() },
      {
        kycData: kycData,
        kycFee: kycFee,
        kycStatus: "pending",
        kycFeePaid: false, // Ensure fee is not paid yet
        isVerified: false, // Set to false when KYC is submitted
      }
    );

    // Create a Nodemailer transporter using the correct SMTP settings for Hostinger
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", // Use Hostinger's S.MTP host
      port: 465, // Port for secure SSL connection
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER, // Your email user
        pass: process.env.EMAIL_PASS, // Your email password
      },
    });

    // Email content
    const emailContent =
      getIDVerificationTemplate(
        formData,
        frontIDSecureUrl,
        backIDSecureUrl,
        email,
        idType
      ) +
      `
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <div style="font-weight: 600; color: #92400e; margin-bottom: 8px; font-size: 14px;">💰 KYC Fee Required</div>
      <div style="color: #92400e; font-size: 14px; line-height: 1.5;">
        KYC verification fee: $${kycFee}. This fee must be paid before verification can be processed.
      </div>
    </div>
  `;

    // Email options
    const mailOptions = {
      from: "support@futurecapital-market.com", // Replace with your email
      to: "support@futurecapital-market.com", // Replace with recipient email
      subject: "ID Verification Request - Future Capital Market",
      html: emailContent,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(frontIDSecureUrl, backIDSecureUrl); // Debugging output
    return NextResponse.json(
      { message: "Email sent successfully", kycFee: kycFee },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: "An error occurred while sending email" },
      { status: 500 }
    );
  }
}
