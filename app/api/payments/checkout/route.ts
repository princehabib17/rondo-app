import { NextResponse } from "next/server";

/** Direct PayMongo match checkout is disabled — players pay via Rondo Wallet only. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Match fees are paid from your Rondo Wallet. Join the match and pay from wallet, or top up first.",
      code: "USE_WALLET",
    },
    { status: 410 }
  );
}
