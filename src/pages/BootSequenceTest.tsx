import { useState } from 'react';
import { BootSequence } from '@/components/entrance/BootSequence';

export default function BootSequenceTest() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-cyan-400 font-orbitron text-2xl tracking-widest">BOOT COMPLETE</p>
        <button
          className="text-sm text-cyan-600 border border-cyan-800 px-4 py-2 rounded hover:border-cyan-400 hover:text-cyan-400 transition-colors"
          onClick={() => setDone(false)}
        >
          Replay
        </button>
      </div>
    );
  }

  return <BootSequence onComplete={() => setDone(true)} />;
}
