// SPDX-License-Identifier: CC-BY-4.0
// This file is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const GRID_SIZE = 5; // 5x5 grid

export default function MinesweeperLottery() {
  const [handle, setHandle] = useState('');
  const [grid, setGrid] = useState<(null | 'mine' | 'safe')[]>([]);
  const [hasClicked, setHasClicked] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [returningUserInfo, setReturningUserInfo] = useState<{ code: string; createdAt: string } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const newGrid = Array(GRID_SIZE * GRID_SIZE).fill(null);
    const mineIndex = Math.floor(Math.random() * newGrid.length);
    newGrid[mineIndex] = 'mine';
    setGrid(newGrid);
  }, []);

  const checkUser = async () => {
    const trimmedHandle = handle.trim();
    const userRef = doc(db, 'users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const docData = userSnap.data();
      setReturningUserInfo({
        code: docData.code,
        createdAt: new Date(docData.createdAt.seconds * 1000).toLocaleString(),
      });
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(collection(db, 'promo_codes'));
    const unusedCodes = codesSnapshot.docs.filter(doc => !doc.data().used);

    if (unusedCodes.length === 0) {
      alert('No promo codes left!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * unusedCodes.length);
    const selectedCode = unusedCodes[randomIndex].data().code;

    await setDoc(doc(db, 'users', trimmedHandle), {
      handle: trimmedHandle,
      code: selectedCode,
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      assignedTo: trimmedHandle,
    });

    setUserCode(selectedCode);
    setShowPopup(true);
  };

  const handleCellClick = (index: number) => {
    if (hasClicked || !handle.trim()) return;
    const newGrid = [...grid];

    if (grid[index] === 'mine') {
      alert('💥 Boom! Try again next event!');
    } else {
      newGrid[index] = 'safe';
      setGrid(newGrid);
      checkUser();
    }

    setHasClicked(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-rose-600 mb-6">Minesweeper Lottery</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="請輸入您的IG帳號"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="border p-2 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {grid.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            className="w-16 h-16 bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold rounded hover:bg-gray-200"
            disabled={hasClicked}
          >
            {cell === 'safe' ? '🎁' : ''}
          </button>
        ))}
      </div>

      {showPopup && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg text-center">
          {returningUserInfo ? (
            <>
              <h2 className="text-xl font-bold text-rose-600 mb-4">📌 您已參加過</h2>
              <p>帳號 {handle} 於 {returningUserInfo.createdAt}</p>
              <p className="mt-2">獲得：{returningUserInfo.code}</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-rose-600 mb-4">🎉 恭喜！</h2>
              <p>帳號 {handle} 抽中：{userCode}</p>
              <p className="mt-2">請截圖並聯繫活動主辦方！</p>
            </>
          )}
          <button
            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
            onClick={() => setShowPopup(false)}
          >
            關閉
          </button>
        </div>
      )}
    </div>
  );
}
