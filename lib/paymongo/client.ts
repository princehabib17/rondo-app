export function getPaymongoAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not set");
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const response = await fetch(
    `https://api.paymongo.com/v1/checkout_sessions/${sessionId}`,
    {
      headers: {
        Authorization: getPaymongoAuthHeader(),
      },
    }
  );

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.errors?.[0]?.detail ?? "Failed to verify payment with PayMongo");
  }

  return json.data;
}

export function isCheckoutSessionPaid(session: {
  attributes?: {
    payments?: Array<{ attributes?: { status?: string } }>;
    payment_status?: string;
    status?: string;
  };
}): boolean {
  const payments = session.attributes?.payments ?? [];
  if (payments.some((p) => p.attributes?.status === "paid")) {
    return true;
  }
  if (session.attributes?.payment_status === "paid") {
    return true;
  }
  return false;
}
