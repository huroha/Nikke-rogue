function finalConsonant(word: string): number | null {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28;
}

/** 받침 유무에 따라 조사를 붙인다. 예: josa('불똥이', '은', '는') → '불똥이는' */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const jong = finalConsonant(word);
  return word + (jong ? withFinal : withoutFinal);
}

/** '으로/로' 전용 (ㄹ 받침은 '로') */
export function josaRo(word: string): string {
  const jong = finalConsonant(word);
  return word + (jong && jong !== 8 ? '으로' : '로');
}
