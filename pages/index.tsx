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
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50">
      <h1 className="text-3xl font-bold mb-4">Join the Lottery!</h1>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Instagram Handle"
            value={igHandle}
            onChange={(e) => setIgHandle(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <button className="bg-pink-500 text-white px-4 py-2 rounded">
            Enter Lottery
          </button>
        </form>
      ) : (
        <p>Thanks for joining! Good luck!</p>
      )}
    </div>
  );
}
