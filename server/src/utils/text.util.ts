export const sanitizeText = (text: string) => {
  return text
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "")
    .replace(/#039;/g, "'")
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/€/g, "Euro")
    .replace(/\//g, "-")
    .trim();
};
