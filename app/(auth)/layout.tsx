import { RondoPage } from "@/components/rondo/primitives";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RondoPage className="flex flex-col justify-center px-6 py-8 max-w-sm mx-auto rondo-phone-frame">
      {children}
    </RondoPage>
  );
}
