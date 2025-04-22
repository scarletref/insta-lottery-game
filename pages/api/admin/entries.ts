import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const snapshot = await getDocs(collection(db, "lottery_entries"));
  const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ entries });
}
