import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;

  // If Supabase sends the auth code to root, forward to callback handler
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`);
  }

  redirect("/welcome");
}
