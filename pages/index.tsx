import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, igHandle }),
    });

    if (res.ok) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-200 to-pink-300 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-extrabold text-center text-rose-600 mb-6">
          🎉 Join the Giveaway!
        </h1>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Instagram Handle</label>
              <input
                type="text"
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value)}
                required
                placeholder="@yourhandle"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-xl transition-transform transform hover:scale-105 shadow-lg"
            >
              Enter Now
            </button>
          </form>
        ) : (
          <div className="text-center text-rose-700 text-lg font-medium">
            ✅ You're in! Good luck 💫
          </div>
        )}
      </div>
    </div>
  );
}
