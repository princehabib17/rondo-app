import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-rondo-black flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        {/* RONDO Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full border-2 border-rondo-yellow flex items-center justify-center">
            <span className="text-rondo-yellow font-bold text-2xl tracking-widest">R</span>
          </div>
          <h1 className="text-white font-bold text-4xl tracking-[0.2em]">RONDO</h1>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <Link
            href="/signup"
            className="w-full bg-rondo-yellow text-rondo-black font-bold py-3 px-6 rounded-lg text-center uppercase tracking-wider hover:brightness-90 transition"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="w-full border border-rondo-yellow text-rondo-yellow font-bold py-3 px-6 rounded-lg text-center uppercase tracking-wider hover:bg-rondo-yellow hover:text-rondo-black transition"
          >
            Log In
          </Link>
        </div>

        {/* Social auth */}
        <div className="text-muted-foreground text-sm">Or login using</div>
        <div className="flex gap-4 justify-center">
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-white hover:border-rondo-yellow transition">
            G
          </button>
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-white hover:border-rondo-yellow transition">
            f
          </button>
        </div>
      </div>
    </main>
  );
}
