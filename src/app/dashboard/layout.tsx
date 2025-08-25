// No providers here, no html/body, no globals.css import
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
