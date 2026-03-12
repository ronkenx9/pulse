import { useState } from 'react';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

const SLIDES = [
  {
    icon: '⚡',
    title: 'WHAT IS PULSE?',
    diagram: `PLAYER A ──────────────── PLAYER B
       ↓                        ↓
   createDuel()             joinDuel()
       ↓                        ↓
       ╔══════ SOMNIA CHAIN ══════╗
       ║  armSignal() → FIRE!    ║
       ╚═════════════════════════╝
       ↓                        ↓
  submitReaction()      submitReaction()
       ↓
  FIRST REACTOR WINS THE POT`,
    desc: 'Real-time reflex duels on Somnia. Two players stake tokens, a signal fires on-chain — the first to react wins everything.',
  },
  {
    icon: '🎯',
    title: 'START A DUEL',
    diagram: `OPTION A — OPEN CHALLENGE
  Click "OPEN CHALLENGE" → get a link
  Share /duel?join=ID with your opponent
  Anyone can join your open duel

OPTION B — DIRECT CHALLENGE
  Enter your opponent's wallet address
  They join via the same duel ID

OPTION C — JOIN A DUEL
  Receive a /duel?join=ID link
  Click it → auto-fill → confirm stake`,
    desc: 'No more manually copying wallet addresses. Open challenges generate a shareable invite link.',
  },
  {
    icon: '🔴',
    title: 'REACT TO THE SIGNAL',
    diagram: `BOTH PLAYERS ARMED AND WAITING...

  [████████████████] WAIT...

  → Signal fires at a random time
  → Screen flashes white

  [  REACT NOW!!! ]  ← HIT THIS

  Milliseconds separate winners from losers.
  Average reaction time: ~220ms`,
    desc: 'When the signal fires, tap REACT instantly. The Somnia Reactivity layer resolves the winner in real-time — zero polling.',
  },
  {
    icon: '☠️',
    title: 'FALSE STARTS',
    diagram: `STATE: ARMED_PENDING (waiting for signal)

  ❌  YOU REACT NOW  →  YOU LOSE

  The signal hasn't fired yet.
  Your opponent gets the entire pot.
  No exceptions. No refunds.

  ✅  WAIT for the FIRE flash.
  ✅  Only react when the screen flashes.`,
    desc: 'React before the signal fires and you forfeit 100% of the stake to your opponent. Patience is a weapon.',
  },
];

export function OnboardingSlideshow({ onComplete, onSkip }: Props) {
  const [slide, setSlide] = useState(0);
  const [key, setKey] = useState(0); // forces re-animation on slide change

  const next = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1);
      setKey(k => k + 1);
    } else {
      onComplete();
    }
  };

  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <button className="onboarding-skip" onClick={onSkip}>SKIP</button>

        <div className="onboarding-slide" key={key}>
          <div className="slide-icon">{s.icon}</div>
          <div className="slide-title">{s.title}</div>
          <pre className="slide-diagram">{s.diagram}</pre>
          <p className="slide-desc">{s.desc}</p>
        </div>

        <div className="onboarding-progress">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i === slide ? 'progress-dot--active' : ''}`}
              onClick={() => { setSlide(i); setKey(k => k + 1); }}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {!isLast ? (
            <button className="onboarding-next" onClick={next}>
              NEXT →
            </button>
          ) : (
            <button className="onboarding-enter" onClick={onComplete}>
              ENTER ARENA ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
