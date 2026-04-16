export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Auth guard — redirect to /login if no session
  return <div className="flex flex-col h-screen overflow-hidden">{children}</div>;
}
