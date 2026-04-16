"use client";

import { useState } from "react";

/**
 * "SAVED" pill with on-click reassurance dialog. The pill's positioning
 * is handled by the parent TopRightPills wrapper — we render just the
 * button + overlay modal here so both can live in the same flex row
 * without clashing fixed coordinates.
 */
export default function SaveReassurance() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Your progress is saved"
        className="bg-white border border-gray-200 px-3 py-1 text-[10px] font-medium tracking-[0.18em] uppercase text-gray-600 hover:text-black hover:border-black transition-colors"
      >
        Saved
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white border border-gray-200 max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-3">
              Your progress is saved
            </p>
            <h2 className="text-xl font-light leading-snug mb-4">
              Everything you&apos;ve shared is already saved.
            </h2>
            <p className="text-sm font-light text-gray-600 leading-relaxed mb-4">
              Close this tab anytime. When you want to come back, go to{" "}
              <span className="text-black">program.highlowbuffalo.co</span>
              {" "}and request a new sign-in link at the email address you
              used — we&apos;ll drop you right back where you left off.
            </p>
            <p className="text-sm font-light text-gray-600 leading-relaxed mb-6">
              Nothing is lost if your laptop dies, your browser crashes, or you
              need to pick this up on a different device.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-black text-white px-8 py-3 text-xs font-medium tracking-widest uppercase hover:opacity-80 transition-opacity w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
