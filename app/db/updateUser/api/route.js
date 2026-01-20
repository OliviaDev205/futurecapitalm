import { NextResponse } from "next/server";
import UserModel from "../../../../mongodbConnect";
import { log } from "console";

// Helper function to ensure numeric fields default to 0
const ensureNumeric = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export async function POST(request) {
  const {
    name,
    email,
    phone,
    password,
    withdrawalPin,
    taxCodePin,
    autoTrades,
    isVerified,
    tradingBalance,
    investmentBalance,
    totalDeposited,
    totalWithdrawn,
    totalAssets,
    totalWon,
    totalLoss,
    lastProfit,
    // investmentPackage,
    planBonus,
    tradingProgress,
    customMessage,
    upgraded,
    trade,
  } = await request.json();

  try {
    // Find the user by email and update their data
    // Ensure all numeric fields default to 0 if null, undefined, or empty
    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        password,
        withdrawalPin,
        taxCodePin,
        autoTrades,
        isVerified,
        tradingBalance: ensureNumeric(tradingBalance),
        investmentBalance: ensureNumeric(investmentBalance),
        totalDeposited: ensureNumeric(totalDeposited),
        totalWithdrawn: ensureNumeric(totalWithdrawn),
        totalAssets: ensureNumeric(totalAssets),
        totalWon: ensureNumeric(totalWon),
        totalLoss: ensureNumeric(totalLoss),
        // investmentPackage,
        lastProfit: ensureNumeric(lastProfit),
        planBonus: ensureNumeric(planBonus),
        tradingProgress: ensureNumeric(tradingProgress),
        customMessage,
        upgraded,
        trade: ensureNumeric(trade),
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return NextResponse.error("User not found", { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully", user });
  } catch (error) {
    return NextResponse.error("Internal Server Error", { status: 500 });
  }
}
