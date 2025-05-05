// SPDX-License-Identifier: CC-BY-4.0
// This file is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)

import { useState, useRef } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import html2canvas from 'html2canvas';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

const Draggable = dynamic(() => import('react-draggable'), { ssr: false });

const ringImages = [
  '/images/ring1.png',
  '/images/ring2.png',
  '/images/ring3.png',
  '/images/ring4.png',
];

export default function HandRingGame() {
  const [placedRings, setPlacedRings] = useState<{ id: string; src: string }[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [igHandle, setIgHandle] = useState('');
  const gameRef = useRef<HTMLDivElement>(null);

  const handlePlaceRing = (src: string) => {
    setPlacedRings([...placedRings, { id: uuidv4(), src }]);
  };

  const handleFinish = async () => {
    const trimmedHandle = igHandle.trim();
    if (!trimmedHandle) return alert('請輸入您的 IG 帳號');

    const userRef = doc(db, 'users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setPromoCode(userSnap.data().code);
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(collection(db, 'promo_codes'));
    const unusedCodes = codesSnapshot.docs.filter(doc => !doc.data().used);

    if (unusedCodes.length === 0) {
      alert('所有折扣碼已領完');
      return;
    }

    const selectedCode = unusedCodes[Math.floor(Math.random() * unusedCodes.length)].data().code;

    await setDoc(userRef, {
      handle: trimmedHandle,
      code: selectedCode,
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      assignedTo: trimmedHandle,
    });

    setPromoCode(selectedCode);
    setShowPopup(true);

    // capture screenshot
    if (gameRef.current) {
      html2canvas(gameRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `ring-style-${trimmedHandle}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-8 relative overflow-hidden">
      <h1 className="text-2xl font-bold text-pink-600 mb-4">Ring Styling Game</h1>

      <div className="mb-2">
        <input
          type="text"
          placeholder="請輸入 IG 帳號"
          value={igHandle}
          onChange={(e) => setIgHandle(e.target.value)}
          className="px-4 py-2 border rounded shadow"
        />
      </div>

      {/* Ring Selector */}
      <div className="flex space-x-3 mb-4 z-20">
        {ringImages.map((src, index) => (
          <button
            key={index}
            onClick={() => handlePlaceRing(src)}
            className="w-16 h-16 border rounded-full overflow-hidden shadow-md hover:scale-105 transition"
          >
            <Image src={src} alt={`Ring ${index + 1}`} width={64} height={64} />
          </button>
        ))}
      </div>

      {/* Hand background with ring placements */}
      <div ref={gameRef} className="relative w-[320px] h-[480px] bg-white rounded-lg shadow-lg">
        <Image src="/images/hands.png" alt="hands" layout="fill" objectFit="contain" />

        {/* Placed Rings */}
        {placedRings.map(ring => (
          <Draggable key={ring.id}>
            <div className="absolute cursor-move w-12 h-12">
              <Image src={ring.src} alt="ring" layout="fill" objectFit="contain" />
            </div>
          </Draggable>
        ))}
      </div>

      <button
        className="mt-6 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        onClick={handleFinish}
      >
        完成設計並獲得折扣碼
      </button>

      {showPopup && (
        <div className="fixed top-20 bg-white p-4 rounded shadow-lg text-center z-30">
          <h2 className="text-xl font-bold text-pink-600 mb-2">🎁 恭喜！</h2>
          <p>帳號 {igHandle} 的折扣碼：</p>
          <p className="text-lg font-mono text-gray-800 mt-1">{promoCode}</p>
          <p className="text-sm mt-2 text-gray-500">已自動下載圖片，可分享到 IG！</p>
          <button
            className="mt-3 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setShowPopup(false)}
          >
            關閉
          </button>
        </div>
      )}
    </div>
  );
}
