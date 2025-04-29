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
  img:number;
}

function createBoard(): Cell[][] {
  const board: Cell[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, adjacent: 0 , img: 0})));

  let minesPlaced = 0;
  while (minesPlaced < NUM_MINES) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      minesPlaced++;
      board[r][c].img = minesPlaced;
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
      revealAllMines(newBoard);
      setGameOver(true);
      handlePrize('normal');
      return;
    }

    if (newBoard[r][c].adjacent === 0) {
      floodReveal(r, c, newBoard);
    }

    setBoard(newBoard);
    checkWin(newBoard);
  };

  const revealAllMines = (boardData: Cell[][]) => {
    const allPositions: [number, number][] = [];

    // Collect all positions
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!boardData[r][c].revealed) {
          allPositions.push([r, c]);
        }
      }
    }
  
    // Reveal cells one by one
    allPositions.forEach(([r, c], index) => {
      setTimeout(() => {
        boardData[r][c].revealed = true;
        setBoard(prev => [...prev.map(row => [...row])]); // trigger re-render
      }, index * 80); // ⏰ Adjust delay (faster reveal)
    });
  };
  
  const checkWin = (newBoard: Cell[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newBoard[r][c].mine && !newBoard[r][c].revealed) {
          return;
        }
      }
    }
    revealAllMines(newBoard);
    setGameWon(true);
    handlePrize('special');


  };

  const adjacentColor = (adjacent: number) => {
    switch (adjacent) {

      case 1:
        return 'bg-green-200 text-green-700';
      case 2:
        return 'bg-yellow-200 text-yellow-700';
      case 3:
        return 'bg-red-200 text-red-700';

      default:
        return 'bg-gray-200 text-gray-800'; // Adjacent = 0
    }
  };
  
  const handlePrize = async (prize_type: string) => {
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
        where('prize_type', '==', prize_type),
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
      prize_type,
      assignedTo: trimmedHandle,
    });

    setUserCode(selectedCode);

    setTimeout(() => {
        setShowPopup(true);
      }, 1000); // 
    
  };

  return (

    <div className="min-h-screen bg-[url('/images/minesweeper_bg.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="relative w-full flex items-center justify-center mb-6">
        <img
          src="/images/misty.png"
          alt="fog"
          className="absolute left-[calc(50%-180px)] top-[-30px] w-32 opacity-60 z-10 animate-float-slower"
        />
        <img
          src="/images/fog.png"
          alt="misty"
          className="absolute right-[calc(50%-180px)] top-[-30px] w-32 opacity-60 z-10  animate-float-slower"
        />
        
      </div>
      <h1 className="text-3xl font-bold text-black mb-6 z-10">耳環踩地雷</h1>

      <div className="mb-4 z-10">
        <input
          type="text"
          placeholder="請輸入您的ig帳號"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="border p-2 rounded-xl bg-white"
          disabled={gameOver || gameWon}
        />
        <button
          className="ml-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-rose-600"
          onClick={checkUser}
          disabled={!handle.trim()}
        >
        開始遊戲
        </button>

      </div>
      <div className={`absolute inset-0 bg-center bg-contain bg-no-repeat z-1 animate-head`}
            style={{ backgroundImage: "url('/images/misty-head.png')" }}
          />

      <div className="grid grid-cols-5 gap-1 z-10">
 
        {board.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => gameStart?revealCell(r, c): (alert('請先輸入ig帳號喔'))}

            className={`w-14 h-14 flex items-center justify-center text-xs font-bold rounded-full shadow-inner ${
              cell.revealed
                ? (cell.mine ? 'animate-explode z-10' : adjacentColor(cell.adjacent))
                : (gameStart ? 'bg-black opacity-60 animate-zoom-in' : 'bg-black opacity-30')
            }`}

            disabled={gameOver || gameWon}
          >
          {cell.revealed && (
            cell.mine ? (
              <img src={`/images/earring_${cell.img}.png`} alt="bomb" className="w-20 h-20" />
            ) : (
              <span className="animate-safe-pop">
              {cell.adjacent > 0 ? cell.adjacent : ''}
              </span>
            )
          )}
          </button>
        )))}
      </div>

      {showPopup && (
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-12 z-20">
          <div className="bg-white p-4 rounded-lg shadow-md text-center w-72 animate-slide-down">

          {returningUserInfo ? (
              <>
                <h2 className="text-xl font-bold text-rose-600 mb-2">帳號重複</h2>
                <p className="text-base mb-2">親愛的 {handle} ，您玩過一次了喔：</p>
                <p className="text-rose-700 font-semibold mb-2">在 {returningUserInfo.createdAt}</p>
                <p className="text-xs text-gray-600 mb-2">
                  折扣碼是：<span className="font-bold">{returningUserInfo.prize} ({returningUserInfo.code})</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-rose-600 mb-2">{gameWon?"😎竟然贏了!?":"😵踩到地雷啦！"}</h2>
                <p className="text-base mb-2">親愛的 {handle} ，{gameWon?"您真是太強了!":"沒關係~"}</p>
                <p className="text-base mb-2">{gameWon?"您得到":"還是有獎"}：<span className="font-bold text-rose-700">{userCode}</span> </p>
                <p className="text-xs text-gray-600 mb-2">請截圖傳給迷霧主人喔</p>
              </>
            )
          }       
            <button
              className="mt-2 px-3 py-1.5 bg-rose-500 text-white rounded-md text-sm hover:bg-rose-600"
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
