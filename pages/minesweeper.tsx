// SPDX-License-Identifier: CC-BY-4.0
// This file is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const GRID_SIZE = 5;
const NUM_MINES = 4;

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

function createBoard(): Cell[][] {
  const board: Cell[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));

  let minesPlaced = 0;
  while (minesPlaced < NUM_MINES) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!board[r][c].mine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (
              r + dr >= 0 && r + dr < GRID_SIZE &&
              c + dc >= 0 && c + dc < GRID_SIZE &&
              board[r + dr][c + dc].mine
            ) {
              count++;
            }
          }
        }
        board[r][c].adjacent = count;
      }
    }
  }

  return board;
}

function isValidInstagramHandle(handle: string): boolean {
    const regex = /^(?!.*\.\.)(?!\.)[a-zA-Z0-9._]{1,30}(?<!\.)$/;
    return regex.test(handle);
}
  
export default function MinesweeperPage() {
  const [handle, setHandle] = useState('');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStart, setGameStart] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [returningUserInfo, setReturningUserInfo] = useState<{ code: string; createdAt: string; prize: string } | null>(null);


  // Reset all local states
  const resetState = () => {
    setUserCode('');
    //setMustSpin(false);
    //setPrizeIndex(0);
    //setHasSpun(false);
    //setShowPopup(false);
    //setReturningUserInfo(null);
  };

  // Check Firestore to see if  playedthis user has already
  const checkUser = async () => {
    resetState();
    const trimmedHandle = handle.trim();
    if (!isValidInstagramHandle(trimmedHandle)) {
      alert('請輸入有效的 IG 帳號（僅限英數、底線、句點，不能開頭或結尾為句點）');
      return;
    }
    const userRef = doc(db, 'minesweeper_users', trimmedHandle);
    const userSnap = await getDoc(userRef);


    if (userSnap.exists()) {
      const docData = userSnap.data();
      setReturningUserInfo({
        code: docData.code,
        prize: docData.prize,
        createdAt: new Date(docData.createdAt.seconds * 1000).toLocaleString(),
      });
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(collection(db, 'minesweeper_promo_codes'));
    //const codes = codesSnapshot.docs;

    const unusedCodes = codesSnapshot.docs.filter(doc => !doc.data().used);
    console.log('Unused codes:', unusedCodes.map(doc => doc.data().code)); // Log unused codes

    
    if (unusedCodes.length === 0) {
      alert('嗚嗚獎品都送完啦');
      return;
    }
    //setBoard(createBoard());
    setGameStart(true);
    //setGameOver(false);
    // start the game
  };

  useEffect(() => {
    setBoard(createBoard());
  }, []);
  
  const floodReveal = (r: number, c: number, newBoard: Cell[][]) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < GRID_SIZE &&
          nc >= 0 && nc < GRID_SIZE &&
          !newBoard[nr][nc].revealed &&
          !newBoard[nr][nc].mine
        ) {
          newBoard[nr][nc].revealed = true;
          if (newBoard[nr][nc].adjacent === 0) {
            floodReveal(nr, nc, newBoard);
          }
        }
      }
    }
  };

  const revealCell = (r: number, c: number) => {
    if (gameOver || gameWon || board[r][c].revealed) return;

    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].revealed = true;

    if (newBoard[r][c].mine) {
      setBoard(newBoard);
      //setTimeout(() => {
        setGameOver(true);
        handlePrize('normal');
      //}, 800); //
      return;
    }

    if (newBoard[r][c].adjacent === 0) {
      floodReveal(r, c, newBoard);
    }

    setBoard(newBoard);
    checkWin(newBoard);
  };

  const checkWin = (newBoard: Cell[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newBoard[r][c].mine && !newBoard[r][c].revealed) {
          return;
        }
      }
    }
    //setTimeout(() => {
    setGameWon(true);
    handlePrize('special');
    //  }, 800); // 

  };

  const handlePrize = async (type: 'normal' | 'special') => {
    const trimmedHandle = handle.trim();
    if (!isValidInstagramHandle(trimmedHandle)) {
      alert('請輸入有效的 IG 帳號（僅限英數、底線、句點，不能開頭或結尾為句點）');
      return;
    }

    const userRef = doc(db, 'minesweeper_users', trimmedHandle);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUserCode(userSnap.data().code);
      setShowPopup(true);
      return;
    }

    const codesSnapshot = await getDocs(
      query(
        collection(db, 'minesweeper_promo_codes'),
        where('type', '==', type),
        where('used', '==', false)
      )
    );

    const unusedCodes = codesSnapshot.docs;

    if (unusedCodes.length === 0) {
      alert('No promo codes left!');
      return;
    }

    const randomDoc = unusedCodes[Math.floor(Math.random() * unusedCodes.length)];
    const selectedCode = randomDoc.data().code;

    await setDoc(doc(db, 'minesweeper_users', trimmedHandle), {
      handle: trimmedHandle,
      code: selectedCode,
      createdAt: new Date(),
    });

    await setDoc(doc(db, 'minesweeper_promo_codes', selectedCode), {
      code: selectedCode,
      used: true,
      type,
      assignedTo: trimmedHandle,
    });

    setUserCode(selectedCode);

    setTimeout(() => {
        setShowPopup(true);
      }, 1000); // 
    
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-rose-600 mb-6">Minesweeper Challenge</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="請輸入您的ig帳號"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="border p-2 rounded-xl"
          disabled={gameOver || gameWon}
        />
        <button
          className="ml-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
          onClick={checkUser}
          disabled={!handle.trim()}
        >
        開始遊戲
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {board.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => gameStart?revealCell(r, c): (alert('請先輸入ig帳號喔'))}
            className={`w-14 h-14 border flex items-center justify-center text-xl font-bold rounded transition-transform ${
                cell.revealed
                  ? (cell.mine
                      ? 'bg-red-500 animate-explode'
                      : 'bg-green-200')
                  : (gameStart ? 'bg-yellow-100 animate-zoom-in' : 'bg-white')
              }`}
              
            disabled={gameOver || gameWon}
          >
            {cell.revealed && (
            cell.mine ? '💣' : (cell.adjacent > 0 ? cell.adjacent : '')
            )}
          </button>
        )))}
      </div>

      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          {returningUserInfo ? (
              <>
                <h2 className="text-2xl font-bold text-rose-600 mb-4">📌 帳號重複</h2>
                <p className="text-lg mb-2">親愛的 {handle} ，您玩過一次踩耳環了喔：</p>
                <p className="text-rose-700 font-semibold mb-2">在 {returningUserInfo.createdAt}</p>
                <p className="text-sm text-gray-600 mb-4">
                  獎項是：<span className="font-bold">{returningUserInfo.prize} ({returningUserInfo.code})</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-rose-600 mb-4">{gameWon?"🎉 恭喜！":"🎉 踩到耳環啦！"}</h2>
                <p className="text-lg mb-2">親愛的 {handle} ，</p>
                <p className="text-lg mb-2">{gameWon?"您贏了！得到特獎：":"雖然輸了，還是得到："}
                <span className="font-bold">{userCode}</span> </p>
                <p className="text-sm text-gray-600 mb-4">請截圖傳給迷霧主人喔</p>
              </>
            )
          }       
            <button
              className="mt-4 px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
              onClick={() => setShowPopup(false)}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
