import { COUNTRY_ROWS } from "@/data/countries";

/** A country Originle accepts as a guess, named as the game names it. */
export interface Country {
  /** ISO 3166-1 alpha-2, as the game uses it. */
  code: string;
  name: string;
  flag: string;
  continent: string;
  /** UN M49 sub-region, written for reading ("East Africa"). */
  region: string;
  capital: string | null;
  /** Official languages, most widely known first. */
  languages: string[];
  landlocked: boolean;
}

const BY_CODE = new Map(COUNTRY_ROWS.map((country) => [country.code, country]));

export const COUNTRY_COUNT = COUNTRY_ROWS.length;

export function countryByCode(code: string): Country | undefined {
  return BY_CODE.get(code);
}

export function isCountryCode(code: string): boolean {
  return BY_CODE.has(code);
}

/** The country's name, or the bare code for anything the game doesn't list. */
export function countryName(code: string): string {
  return BY_CODE.get(code)?.name ?? code;
}

/** Names that read naturally after "in" ("the United States", "the Philippines"). */
const TAKES_THE = new Set(["US", "GB", "AE", "NL", "PH", "BS", "GM", "CD", "CG", "CF", "DO", "MV", "MH", "SB", "VA"]);

export function countryInSentence(country: Country): string {
  return TAKES_THE.has(country.code) ? `the ${country.name}` : country.name;
}
