import { RondoPage } from "@/components/rondo/primitives";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RondoPage className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-8">
      {children}
    </RondoPage>
  );
}
