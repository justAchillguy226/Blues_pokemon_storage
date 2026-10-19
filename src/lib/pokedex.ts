import speciesData from './pokemon-species.json';
import { PokemonSpecies } from './types';

export const POKEMON_SPECIES_LIST: PokemonSpecies[] = speciesData as PokemonSpecies[];

const speciesMap = new Map<number, PokemonSpecies>(
  POKEMON_SPECIES_LIST.map((sp) => [sp.dexNumber, sp])
);

export function getSpeciesByDex(dexNumber: number): PokemonSpecies {
  return (
    speciesMap.get(dexNumber) || {
      dexNumber,
      nameZh: `寶可夢 #${dexNumber}`,
      nameEn: `Pokemon #${dexNumber}`,
      isLegendary: false,
      isUltraBeast: false,
    }
  );
}

export function formatDexNumber(dexNumber: number): string {
  return `No.${String(dexNumber).padStart(4, '0')}`;
}

export function getPokemonSpriteUrl(dexNumber: number, isShiny: boolean): string {
  if (isShiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${dexNumber}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNumber}.png`;
}
