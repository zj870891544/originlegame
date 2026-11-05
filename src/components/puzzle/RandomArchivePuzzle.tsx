"use client";

export function RandomArchivePuzzle({ numbers }: { numbers: number[] }) {
  function pickPuzzle() {
    const number = numbers[Math.floor(Math.random() * numbers.length)];
    window.location.assign(`/archive/${number}`);
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={pickPuzzle}>
      Random puzzle
    </button>
  );
}
