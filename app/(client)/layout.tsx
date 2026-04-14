export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Auth guard — redirect to /login if no session
  return <div className="flex flex-col min-h-screen">{children}</div>;
}
