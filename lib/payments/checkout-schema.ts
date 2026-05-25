import { z } from "zod";

export const checkoutBodySchema = z.object({
  gameId: z.string().uuid("Invalid game ID"),
  teamId: z.string().uuid("Invalid team ID").nullable().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
