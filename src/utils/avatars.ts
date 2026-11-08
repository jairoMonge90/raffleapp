import { Gender } from '../types';

/**
 * Returns a high quality SVG Data URI for default male / female avatars
 * when a user does not upload a personal photo.
 */
export function getDefaultAvatar(gender: Gender, name: string = ''): string {
  const initial = name ? name.trim().charAt(0).toUpperCase() : (gender === 'hombre' ? 'H' : 'M');

  if (gender === 'hombre') {
    // Stylized modern Male Avatar SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bgH" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="60" fill="url(#bgH)"/>
      <!-- Body shoulders -->
      <path d="M 22 108 C 22 86, 40 76, 60 76 C 80 76, 98 86, 98 108 Z" fill="#93c5fd"/>
      <!-- Neck -->
      <rect x="52" y="60" width="16" height="20" rx="4" fill="#fde047" opacity="0.8"/>
      <!-- Head -->
      <circle cx="60" cy="46" r="24" fill="#fed7aa"/>
      <!-- Hair Short Male -->
      <path d="M 36 44 C 36 28, 46 22, 60 22 C 74 22, 84 28, 84 44 C 84 34, 76 28, 60 28 C 44 28, 36 34, 36 44 Z" fill="#1e293b"/>
      <!-- Eyes & Smile -->
      <circle cx="52" cy="46" r="2.5" fill="#1e293b"/>
      <circle cx="68" cy="46" r="2.5" fill="#1e293b"/>
      <path d="M 54 55 Q 60 60 66 55" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    // Stylized modern Female Avatar SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bgM" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#be185d"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="60" fill="url(#bgM)"/>
      <!-- Hair back -->
      <circle cx="60" cy="54" r="32" fill="#312e81"/>
      <!-- Body shoulders -->
      <path d="M 22 108 C 22 86, 40 76, 60 76 C 80 76, 98 86, 98 108 Z" fill="#fbcfe8"/>
      <!-- Neck -->
      <rect x="53" y="62" width="14" height="18" rx="4" fill="#fde047" opacity="0.8"/>
      <!-- Head -->
      <circle cx="60" cy="46" r="23" fill="#fed7aa"/>
      <!-- Hair Bangs Female -->
      <path d="M 37 42 C 37 28, 48 23, 60 23 C 72 23, 83 28, 83 42 C 78 34, 68 31, 60 31 C 52 31, 42 34, 37 42 Z" fill="#312e81"/>
      <!-- Eyes & Smile -->
      <circle cx="52" cy="46" r="2.5" fill="#312e81"/>
      <circle cx="68" cy="46" r="2.5" fill="#312e81"/>
      <path d="M 54 54 Q 60 59 66 54" stroke="#be185d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
