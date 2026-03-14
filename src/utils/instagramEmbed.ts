/**
 * Extrai o shortcode (ID) do post do Instagram a partir do HTML do embed.
 * O embed da API vem como: data-instgrm-permalink="https://www.instagram.com/p/SHORTCODE/"
 */
const INSTAGRAM_POST_ID_REGEX = /instagram\.com\/p\/([A-Za-z0-9_-]+)/i

export function getInstagramPostIdFromEmbedHtml(embedHtml: string): string | null {
  if (!embedHtml || typeof embedHtml !== 'string') return null
  const match = embedHtml.match(INSTAGRAM_POST_ID_REGEX)
  return match ? match[1] : null
}

/** URL do post para abrir no navegador / app Instagram. */
export function getInstagramPostUrlFromEmbedHtml(embedHtml: string): string | null {
  const id = getInstagramPostIdFromEmbedHtml(embedHtml)
  return id ? `https://www.instagram.com/p/${id}/` : null
}
