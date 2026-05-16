export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] px-10 py-12">
        {children}
      </div>
    </div>
  );
}
