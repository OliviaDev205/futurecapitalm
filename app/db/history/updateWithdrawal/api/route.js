import { NextResponse } from "next/server";
import UserModel from "../../../../../mongodbConnect";
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

    const updatedUser = await UserModel.findOneAndUpdate(
      { email: lowerEmail, "withdrawalHistory.id": transactionId },
      updateObj,
      {
        new: true, // Return the updated document
      }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User or withdrawal record not found" },
        { status: 404 }
      );
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
