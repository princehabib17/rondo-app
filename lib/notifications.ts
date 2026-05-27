import { createClient } from "@/lib/supabase/client";

interface PushNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

export async function pushInAppNotification(input: PushNotificationInput) {
  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
  });
}
