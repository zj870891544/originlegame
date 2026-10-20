"use client";

import { useId, useState, type FormEvent } from "react";
import { countryName } from "@/lib/countries";
import { DEFAULT_TOLERANCE_KM, MAX_DISTANCE_KM, MAX_TOLERANCE_KM, MAX_SOLVER_GUESSES, SOLVER_COUNTRIES as countries, SOLVER_CONTINENTS as continents, solveCountries, type SolverResult } from "@/lib/solver";

const fieldClass = "min-h-11 w-full rounded border-[1.5px] border-rule bg-card px-3 py-2 text-base";
interface Row { countryCode: string; distance: string }
const blank = (): Row => ({ countryCode: "", distance: "" });

export function CountrySolver() {
  const id = useId();
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [continent, setContinent] = useState("");
  const [tolerance, setTolerance] = useState(String(DEFAULT_TOLERANCE_KM));
  const [result, setResult] = useState<SolverResult | null>(null);
  const [showAll, setShowAll] = useState(false);
  const clearResult = () => { setResult(null); setShowAll(false); };
  const changeRow = (index: number, patch: Partial<Row>) => {
    setRows((previous) => previous.map((row, i) => i === index ? { ...row, ...patch } : row));
    clearResult();
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = solveCountries({
      guesses: rows.map((row) => ({ countryCode: row.countryCode, distanceKm: row.distance.trim() ? Number(row.distance) : NaN })),
      continent: continent || undefined,
      toleranceKm: tolerance.trim() ? Number(tolerance) : NaN,
    });
    setResult(next);
    setShowAll(false);
  };
  const visible = result?.candidates.slice(0, showAll ? undefined : 12) ?? [];

  return (
    <div className="sheet p-5 sm:p-7">
      <form onSubmit={submit}>
        <fieldset>
          <legend className="subheading">Your wrong guesses</legend>
          <p className="mt-2 muted">Copy each country and its distance from the game. One guess is enough to start; a second can narrow the list.</p>
          <div className="mt-5 space-y-5">
            {rows.map((row, index) => (
              <div key={index} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                <div className="min-w-0">
                  <label htmlFor={`${id}-country-${index}`} className="mb-2 block text-sm font-semibold">Country you guessed (guess {index + 1})</label>
                  <select id={`${id}-country-${index}`} required value={row.countryCode} onChange={(event) => changeRow(index, { countryCode: event.target.value })} className={fieldClass}>
                    <option value="">Choose a country</option>
                    {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${id}-distance-${index}`} className="mb-2 block text-sm font-semibold">Distance shown (km), guess {index + 1}</label>
                  <input id={`${id}-distance-${index}`} required type="number" min="0" max={MAX_DISTANCE_KM} step="1" inputMode="numeric" placeholder="e.g. 640" value={row.distance} onChange={(event) => changeRow(index, { distance: event.target.value })} className={fieldClass} />
                </div>
                {rows.length > 1 ? <button type="button" className="btn btn-ghost min-h-11 px-3" aria-label={`Remove guess ${index + 1}`} onClick={() => { setRows(rows.filter((_, i) => i !== index)); clearResult(); }}>Remove</button> : <span />}
              </div>
            ))}
          </div>
          {rows.length < MAX_SOLVER_GUESSES && <button type="button" className="btn btn-ghost mt-4" onClick={() => { setRows([...rows, blank()]); clearResult(); }}>Add another guess</button>}
        </fieldset>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-continent`} className="mb-2 block text-sm font-semibold">Continent clue (optional)</label>
            <select id={`${id}-continent`} value={continent} className={fieldClass} onChange={(event) => { setContinent(event.target.value); clearResult(); }}>
              <option value="">Any continent</option>
              {continents.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-tolerance`} className="mb-2 block text-sm font-semibold">Allow a distance difference of (km)</label>
            <input id={`${id}-tolerance`} required type="number" min="0" max={MAX_TOLERANCE_KM} step="1" inputMode="numeric" value={tolerance} className={fieldClass} onChange={(event) => { setTolerance(event.target.value); clearResult(); }} aria-describedby={`${id}-accuracy`} />
          </div>
        </div>
        <p id={`${id}-accuracy`} className="mt-4 text-sm muted">These are independent map estimates. Overseas territories and boundary definitions can cause large differences from the game. A wider tolerance may help, but the correct country can still be missing.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" data-ga-event="solver_filter">Find candidate countries</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setRows([blank()]); setContinent(""); setTolerance(String(DEFAULT_TOLERANCE_KM)); clearResult(); }}>Clear guesses</button>
        </div>
        <p className="mt-3 text-sm muted">Candidate names appear after you filter. Your entries stay in this browser; the helper does not load today&apos;s answer.</p>
      </form>
      <div className="mt-7" role="status" aria-live="polite" aria-atomic="true">
        {result?.status === "matches" && <p className="font-display text-xl font-semibold">{result.candidates.length} candidate {result.candidates.length === 1 ? "country" : "countries"} within {result.toleranceKm.toLocaleString("en-US")} km of every distance you entered.</p>}
        {result && result.status !== "matches" && <p>{result.message ?? "No candidates match these inputs. Check the distances, remove the continent filter or allow a wider difference."}</p>}
      </div>
      {result?.status === "matches" && (
        <section aria-label="Candidate countries" className="mt-4">
          <p className="text-sm muted">Sorted by the difference from your feedback, not by the chance of being today&apos;s answer. Already-guessed countries are excluded.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {visible.map((candidate) => (
              <li key={candidate.country.code} className="rounded border border-rule bg-paper p-4">
                <h3 className="font-display text-lg font-semibold">{candidate.country.flag} {candidate.country.name}</h3>
                <p className="mt-1 text-sm muted">{candidate.country.region} · {candidate.country.continent}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  {candidate.comparisons.map((comparison) => (
                    <div key={comparison.guessedCode}>
                      <dt className="font-semibold">From {countryName(comparison.guessedCode)}</dt>
                      <dd>Map estimate {Math.round(comparison.modelKm).toLocaleString("en-US")} km; you entered {comparison.shownKm.toLocaleString("en-US")} km.</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          {!showAll && result.candidates.length > visible.length && <button type="button" className="btn btn-ghost mt-5" onClick={() => setShowAll(true)}>Show all {result.candidates.length} candidates</button>}
        </section>
      )}
      <noscript><p className="mt-4">The interactive filter needs JavaScript. The instructions and sources below remain available.</p></noscript>
    </div>
  );
}
