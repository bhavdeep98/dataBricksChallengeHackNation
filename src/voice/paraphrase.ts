/**
 * Convert first-person patient description to third-person for the agent.
 * "I was playing soccer and I seem to have broken my elbow" →
 * "they were playing soccer and seem to have broken their elbow"
 */
export function toThirdPerson(text: string): string {
  return text
    .replace(/\bI am\b/gi, "they are")
    .replace(/\bI was\b/gi, "they were")
    .replace(/\bI have\b/gi, "they have")
    .replace(/\bI've\b/gi, "they've")
    .replace(/\bI think\b/gi, "they think")
    .replace(/\bI seem\b/gi, "they seem")
    .replace(/\bI feel\b/gi, "they feel")
    .replace(/\bI can't\b/gi, "they can't")
    .replace(/\bI cannot\b/gi, "they cannot")
    .replace(/\bI don't\b/gi, "they don't")
    .replace(/\bI need\b/gi, "they need")
    .replace(/\bI got\b/gi, "they got")
    .replace(/\bI fell\b/gi, "they fell")
    .replace(/\bI hit\b/gi, "they hit")
    .replace(/\bI hurt\b/gi, "they hurt")
    .replace(/\bI broke\b/gi, "they broke")
    .replace(/\bmy\b/gi, "their")
    .replace(/\bme\b/gi, "them")
    .replace(/\bmine\b/gi, "theirs")
    .replace(/\bI\b/g, "they")
    .replace(/\bit is paining\b/gi, "it is hurting")
    .replace(/\bpaining a lot\b/gi, "in a lot of pain");
}
