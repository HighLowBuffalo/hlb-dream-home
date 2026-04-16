// One-shot seed: create a non-admin test user so we can exercise the
// client survey flow via /api/dev/impersonate.
//
// Idempotent — re-running is safe. Exits non-zero on real failures.
//
// Usage:
//   node scripts/create-test-user.mjs

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./util/loadEnv.mjs";

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = "client-test@highlowbuffalo.co";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

// Check if user exists.
const { data: listData, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}

let user = listData.users.find((u) => u.email?.toLowerCase() === TEST_EMAIL);

if (user) {
  console.log(`User ${TEST_EMAIL} already exists (${user.id}).`);
} else {
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      email_confirm: true,
    });
  if (createError || !created?.user) {
    console.error("createUser failed:", createError?.message);
    process.exit(1);
  }
  user = created.user;
  console.log(`Created ${TEST_EMAIL} (${user.id}).`);
}

// Ensure profile row (idempotent), is_admin=false explicitly.
const { error: profileError } = await admin.from("profiles").upsert(
  {
    id: user.id,
    email: user.email,
    is_admin: false,
  },
  { onConflict: "id" }
);

if (profileError) {
  console.error("profile upsert failed:", profileError.message);
  process.exit(1);
}

console.log(
  `Profile for ${TEST_EMAIL} is ready (is_admin=false). Impersonate with:`
);
console.log(
  `  fetch('/api/dev/impersonate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'${TEST_EMAIL}'})})`
);
