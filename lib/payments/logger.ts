type PaymentLogLevel = "info" | "warn" | "error";

interface PaymentLogPayload {
  event: string;
  level?: PaymentLogLevel;
  [key: string]: unknown;
}

export function logPayment(payload: PaymentLogPayload) {
  const { level = "info", event, ...rest } = payload;
  const entry = {
    scope: "payments",
    event,
    timestamp: new Date().toISOString(),
    ...rest,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
