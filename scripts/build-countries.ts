/**
 * Writes src/data/countries.ts: the 197 countries Originle accepts as guesses,
 * named exactly as the game names them, with the plain facts the hints use.
 *
 *   npx tsx scripts/build-countries.ts
 *
 * - Codes and display names follow the official game's guess list (Intl region
 *   names in English, with the game's own overrides such as "Czechia").
 * - Capitals and official languages come from the `countries-list` package (MIT).
 * - Regions follow the UN M49 geoscheme, written out below; continents are
 *   derived from the region so the two never disagree.
 * - Landlocked countries are listed by hand below.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { countries as facts, getEmojiFlag, languages as languageNames } from "countries-list";

/** The game's guess list, in its own order (originle.io/hush/hush.js, checked 2026-10-15). */
const CODES =
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW PS TW XK".split(" ");

/** The game's name overrides; everything else is the English Intl region name. */
const GAME_NAMES: Record<string, string> = {
  CZ: "Czechia",
  CD: "DR Congo",
  CG: "Republic of the Congo",
  CI: "Côte d’Ivoire",
  VA: "Vatican City",
  KR: "South Korea",
  KP: "North Korea",
  TR: "Türkiye",
  PS: "Palestine",
  XK: "Kosovo",
};

/** UN M49 sub-regions, with Cyprus kept with Southern Europe as most players expect. */
const REGIONS: Record<string, { continent: string; codes: string }> = {
  "North Africa": { continent: "Africa", codes: "DZ EG LY MA SD TN" },
  "East Africa": { continent: "Africa", codes: "BI KM DJ ER ET KE MG MW MU MZ RW SC SO SS TZ UG ZM ZW" },
  "Central Africa": { continent: "Africa", codes: "AO CM CF TD CG CD GQ GA ST" },
  "Southern Africa": { continent: "Africa", codes: "BW SZ LS NA ZA" },
  "West Africa": { continent: "Africa", codes: "BJ BF CV CI GM GH GN GW LR ML MR NE NG SN SL TG" },
  "the Caribbean": { continent: "North America", codes: "AG BS BB CU DM DO GD HT JM KN LC VC TT" },
  "Central America": { continent: "North America", codes: "BZ CR SV GT HN MX NI PA" },
  "Northern America": { continent: "North America", codes: "CA US" },
  "South America": { continent: "South America", codes: "AR BO BR CL CO EC GY PY PE SR UY VE" },
  "Central Asia": { continent: "Asia", codes: "KZ KG TJ TM UZ" },
  "East Asia": { continent: "Asia", codes: "CN JP KP KR MN TW" },
  "Southeast Asia": { continent: "Asia", codes: "BN KH ID LA MY MM PH SG TH TL VN" },
  "South Asia": { continent: "Asia", codes: "AF BD BT IN IR MV NP PK LK" },
  "Western Asia": { continent: "Asia", codes: "AM AZ BH GE IQ IL JO KW LB OM PS QA SA SY TR AE YE" },
  "Eastern Europe": { continent: "Europe", codes: "BY BG CZ HU PL MD RO RU SK UA" },
  "Northern Europe": { continent: "Europe", codes: "DK EE FI IS IE LV LT NO SE GB" },
  "Southern Europe": { continent: "Europe", codes: "AL AD BA HR CY GR VA IT MT ME MK PT SM RS SI ES XK" },
  "Western Europe": { continent: "Europe", codes: "AT BE FR DE LI LU MC NL CH" },
  "Australia and New Zealand": { continent: "Oceania", codes: "AU NZ" },
  Melanesia: { continent: "Oceania", codes: "FJ PG SB VU" },
  Micronesia: { continent: "Oceania", codes: "KI MH FM NR PW" },
  Polynesia: { continent: "Oceania", codes: "WS TO TV" },
};

const LANDLOCKED = new Set(
  "AF AD AM AT AZ BY BT BO BW BF BI CF TD CZ SZ ET HU KZ XK KG LA LS LI LU ML MD MN NP NE MK PY RW SM RS SK SS CH TJ UG VA ZM ZW UZ TM".split(" "),
);

/** Capitals that are disputed or easily misread; the hints never need them. */
const NO_CAPITAL = new Set(["IL", "PS"]);

const regionOf = new Map<string, { region: string; continent: string }>();
for (const [region, { continent, codes }] of Object.entries(REGIONS)) {
  for (const code of codes.split(" ")) {
    if (regionOf.has(code)) throw new Error(`${code} is in two regions`);
    regionOf.set(code, { region, continent });
  }
}

const display = new Intl.DisplayNames(["en"], { type: "region" });
const rows = CODES.map((code) => {
  const place = regionOf.get(code);
  const fact = (facts as Record<string, { capital: string; languages: string[] }>)[code];
  if (!place) throw new Error(`${code} has no region`);
  if (!fact) throw new Error(`${code} is missing from countries-list`);
  const name = GAME_NAMES[code] ?? display.of(code);
  if (!name || name === code) throw new Error(`${code} has no English name`);
  const langs = fact.languages
    .map((lang) => (languageNames as Record<string, { name: string }>)[lang]?.name)
    .filter((lang): lang is string => Boolean(lang));
  return {
    code,
    name,
    flag: getEmojiFlag(code as never),
    continent: place.continent,
    region: place.region,
    capital: NO_CAPITAL.has(code) ? null : fact.capital || null,
    languages: [...new Set(langs)],
    landlocked: LANDLOCKED.has(code),
  };
});
const unused = [...regionOf.keys()].filter((code) => !CODES.includes(code));
if (unused.length) throw new Error(`Regions list codes the game doesn't use: ${unused.join(" ")}`);

const body = rows.map((row) => `  ${JSON.stringify(row)},`).join("\n");
const out = `/**
 * Generated by scripts/build-countries.ts — do not edit by hand.
 * The ${rows.length} countries Originle accepts, named as the game names them.
 * Capitals and languages: countries-list (MIT). Regions: UN M49 geoscheme.
 */
import type { Country } from "@/lib/countries";

export const COUNTRY_ROWS: Country[] = [
${body}
];
`;
writeFileSync(resolve(import.meta.dirname, "../src/data/countries.ts"), out);
console.log(`Wrote ${rows.length} countries`);
