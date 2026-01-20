import { NextResponse } from "next/server";
import mongoose from "mongoose";
import UserModel from "../../../mongodbConnect";

export async function POST(request) {
  const { plan, email, amount } = await request.json();

  try {
    // Find the user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      // User not found, handle the error accordingly
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, success: false }
      );
    }

    // Validate amount is positive
    const purchaseAmount = parseFloat(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      return NextResponse.json(
        { message: "Invalid amount" },
        { status: 400, success: false }
      );
    }

    // Check if user has sufficient balance
    const currentBalance = parseFloat(user.tradingBalance) || 0;
    if (currentBalance < purchaseAmount) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400, success: false }
      );
    }

    // Deactivate all previous plans
    if (user.mainInvestmentPackage && user.mainInvestmentPackage.length > 0) {
      user.mainInvestmentPackage.forEach((investment) => {
        if (investment.status === "Activated") {
          investment.status = "Deactivated";
        }
      });
    }

    // Add the new notification to the user's notifications array
    user.tradingBalance -= purchaseAmount;
    user.investmentBalance += purchaseAmount;
    user.investmentPackage = plan;
    user.mainInvestmentPackage.push({  id: new mongoose.Types.ObjectId(), plan, initializedAt: new Date(), status: "Activated", amount: purchaseAmount });

    await user.save();

    // Return a success response
    return NextResponse.json({
      message: "plan added",
      status: 200,
      success: true,
    });
  } catch (error) {
    console.error("Error purchasing plan:", error);
    // Handle any errors and return an appropriate error response
    return NextResponse.json(
      { message: "Failed to purchase plan" },
      { status: 500, success: false }
    );
  }
}
