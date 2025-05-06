export default function Sparkles() {
    return (
      <>
        <svg viewBox="0 0 24 24" fill="none"
          className="absolute w-5 h-5 top-[-12px] left-[50%] -translate-x-1/2 z-20 animate-star-burst animate-delay-1 pointer-events-none">
          <path d="M12 2L13 8L20 10L13 12L12 18L11 12L4 10L11 8L12 2Z" fill="black" />
        </svg>
  
        <svg viewBox="0 0 24 24" fill="none"
          className="absolute w-4 h-4 top-[-8px] left-[40%] z-20 animate-star-burst animate-delay-2 pointer-events-none">
          <path d="M12 2L13 8L20 10L13 12L12 18L11 12L4 10L11 8L12 2Z" fill="purple" />
        </svg>
  
        <svg viewBox="0 0 24 24" fill="none"
          className="absolute w-4 h-4 top-[-10px] left-[60%] z-20 animate-star-burst animate-delay-3 pointer-events-none">
          <path d="M12 2L13 8L20 10L13 12L12 18L11 12L4 10L11 8L12 2Z" fill="green" />
        </svg>
      </>
    );
  }
  