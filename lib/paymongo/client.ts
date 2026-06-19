let _authHeader: string | null = null;

export function getPaymongoAuthHeader(): string {
  if (_authHeader) return _authHeader;
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not set");
  }
  _authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  return _authHeader;
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
