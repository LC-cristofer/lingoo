"use client";

import { Nino } from "@/art/nino/Nino";

/** The break: Nino is asleep in his nest and the island waits. One big button brings the child back. */
export function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div className="nz-pause" role="dialog" aria-modal="true" aria-label="Pausa" data-testid="pause">
      <div className="nz-pause-box">
        <span className="nz-pause-nino" aria-hidden="true"><Nino pose="sleep" size={150} /></span>
        <h2 className="nz-pause-title">Pausa</h2>
        <p className="nz-pause-text">O Nino foi descansar no ninho. Quando quiser, é só voltar.</p>
        <button type="button" className="k-btn k-btn-area min-h-16 min-w-16 nz-pause-btn" onClick={onResume} autoFocus>
          Voltar a brincar
        </button>
      </div>
    </div>
  );
}
