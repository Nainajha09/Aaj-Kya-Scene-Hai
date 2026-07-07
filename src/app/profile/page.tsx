import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-[#16151d] text-[#efe9dd] p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-1">Your Scene</h1>
        <p className="text-sm text-[#aca3bd] mb-6">{user.email}</p>
        <a href="/radar" className="inline-block text-xs font-semibold text-[#cf8a5e] mb-4">
          → Go to Scene Radar
        </a>
        <ProfileForm initialProfile={profile} />
      </div>
    </main>
  );
}
