export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rondo-page mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-5 py-8">
      {children}
    </div>
  );
}
