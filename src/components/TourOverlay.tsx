"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { TOUR_STEPS, getStepIndexForPath } from "@/lib/tourSteps";

function TourOverlayInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourActive = searchParams.get("tour") !== null;

  if (!tourActive) return null;

  const stepIndex = getStepIndexForPath(pathname);
  if (stepIndex === -1) return null;

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const nextStep = !isLast ? TOUR_STEPS[stepIndex + 1] : null;

  function endTour() {
    router.push(pathname);
  }

  function next() {
    if (nextStep) {
      router.push(`${nextStep.path}?tour=1`);
    } else {
      endTour();
    }
  }

  return (
    <div className="fixed bottom-[64px] left-0 right-0 z-[80] flex justify-center px-4 pointer-events-none">
      <div className="max-w-sm w-full bg-[#221f38] border border-[#b298e7]/50 rounded-2xl p-4 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-[#b6abd9]">
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button onClick={endTour} className="text-[10px] text-[#b6abd9] underline">
            Skip tour
          </button>
        </div>
        <div className="font-bold text-sm mb-1">{step.title}</div>
        <p className="text-xs text-[#f3eefb]/90 mb-3 leading-relaxed">{step.description}</p>
        <button
          onClick={next}
          className="w-full rounded-lg bg-[#b298e7] text-[#1e1830] font-semibold py-2.5 text-xs"
        >
          {isLast ? "Got it, let's go! 🎉" : `Next: ${nextStep?.label} →`}
        </button>
      </div>
    </div>
  );
}

export default function TourOverlay() {
  return (
    <Suspense fallback={null}>
      <TourOverlayInner />
    </Suspense>
  );
}
