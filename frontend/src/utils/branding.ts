import { sanitizeUrl } from '@/utils/url'

export function updateFavicon(logoUrl: string): void {
  const sanitizedLogoUrl = sanitizeUrl(logoUrl, {
    allowRelative: true,
    allowDataUrl: true,
  })
  if (!sanitizedLogoUrl) {
    return
  }

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  const dataType = sanitizedLogoUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+)[;,]/)?.[1]
  const extension = sanitizedLogoUrl.split(/[?#]/, 1)[0].split('.').pop()?.toLowerCase()
  const imageTypes: Record<string, string> = {
    svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon',
  }
  link.type = dataType || imageTypes[extension || ''] || 'image/x-icon'
  link.href = sanitizedLogoUrl
}
