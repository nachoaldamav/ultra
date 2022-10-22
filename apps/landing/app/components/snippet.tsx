import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import CheckCopyIcon from "./icons/checkCopy";
import CopyIcon from "./icons/copy";

export default function Snippet() {
  const [isCopied, setIsCopied] = useState(false);
  const [text, setText] = useState("npm install ultra-pkg -g");

  useEffect(() => {
    // After 2 seconds, reset the isCopied state and set text to "snpm install"
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
        setText("ultra install react react-dom -P");
      }, 2000);
    }
  }, [isCopied]);

  return (
    <div className="mt-10 snippet">
      <span className="font-mono font-semibold text-[#A1A1AA]">{text}</span>
      <button
        className={isCopied ? "ml-2 text-green-400" : "ml-2 text-gray-400"}
        onClick={() => {
          navigator.clipboard.writeText(text);
          setIsCopied(true);
          confetti({
            particleCount: 100,
            gravity: 0.2,
            disableForReducedMotion: true,
            origin: {
              x: 0.58,
              y: 0.65,
            },
          });
        }}
      >
        <div className="items-center p-2 flex-none order-1 flex-grow-0 snippet-icon">
          {isCopied ? <CheckCopyIcon /> : <CopyIcon />}
        </div>
      </button>
    </div>
  );
}
