import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, igHandle } = req.body;
    if (!email || !igHandle) return res.status(400).end("Missing fields");

    try {
      await addDoc(collection(db, "lottery_entries"), {
        email,
        igHandle,
        createdAt: serverTimestamp(),
      });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).end("Server error");
    }
  } else {
    res.status(405).end("Method Not Allowed");
  }
}
