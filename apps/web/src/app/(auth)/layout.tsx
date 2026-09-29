export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% -5%, rgba(124,58,237,0.2) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="font-mono text-2xl font-bold tracking-tight">
            <span className="text-violet-light">Key</span>
            <span className="text-correct">stra</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
