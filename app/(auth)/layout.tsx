export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-8 max-w-lg mx-auto">
      {children}
    </div>
  );
}
