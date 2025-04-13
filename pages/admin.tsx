import { useEffect, useState } from "react";

export default function Admin() {
  const [entries, setEntries] = useState<any[]>([]);
  const [winner, setWinner] = useState<any | null>(null);
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const fetchEntries = async () => {
    const res = await fetch("/api/admin/entries", {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      setAuthorized(true);
    } else {
      alert("Wrong password");
    }
  };

  const pickWinner = () => {
    if (entries.length === 0) return;
    const rand = Math.floor(Math.random() * entries.length);
    setWinner(entries[rand]);
  };

  return (
    <div className="p-6">
      {!authorized ? (
        <div>
          <h1 className="text-xl font-bold mb-2">Admin Login</h1>
          <input
            type="password"
            placeholder="Enter Admin Password"
            className="border p-2 mr-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={fetchEntries} className="bg-blue-500 text-white px-4 py-2 rounded">
            Login
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Total Entries: {entries.length}</h2>
          <button onClick={pickWinner} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
            Pick Winner
          </button>
          {winner && (
            <div className="p-4 bg-yellow-100 border rounded">
              <strong>Winner:</strong> @{winner.igHandle} ({winner.email})
            </div>
          )}
          <ul className="mt-6">
            {entries.map((entry) => (
              <li key={entry.id} className="border-b py-1">
                @{entry.igHandle} – {entry.email}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
