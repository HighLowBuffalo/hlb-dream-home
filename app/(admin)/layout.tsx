export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Admin guard — redirect if not is_admin
  return <div className="flex flex-col min-h-screen">{children}</div>;
}
