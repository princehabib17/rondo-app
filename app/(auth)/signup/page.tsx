import { redirect } from "next/navigation";

/** Legacy /signup entry — join flow starts at slides now. */
export default function SignupRedirectPage() {
  redirect("/onboarding/slides");
}
