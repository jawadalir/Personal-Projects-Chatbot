import { useEffect, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import { fetchProfile } from "./lib/chatApi";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error} — make sure the server is running on port 5000.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-indigo-50/30 to-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-indigo-600">
            AI Portfolio Representative
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {profile ? `Chat with ${profile.name}` : "Loading..."}
          </h1>
          {profile && (
            <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
              {profile.title} · {profile.location}
            </p>
          )}
        </header>

        <ChatWindow profile={profile} />
      </div>
    </div>
  );
}
