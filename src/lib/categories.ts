export const CATEGORY_COLORS: Record<string, string> = {
  Painting: '#c1571f',
  Wallpaper: '#5f7a4f',
  Kitchen: '#a2703c',
  Storage: '#3f6ea5',
  Guides: '#7c5a96',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Painting: 'Real paint costs, DIY vs. professional pricing, and tools compared for every room.',
  Wallpaper: 'Removable wallpaper and decal costs compared to paint, with real per-room pricing.',
  Kitchen: 'Cabinet, countertop, backsplash and lighting upgrades compared by real cost.',
  Storage: 'Renter-friendly storage and shelving options ranked by cost and deposit risk.',
  Guides: 'Budgeting, deposit-protection and move-in/move-out cost guides for renters.',
};

export function categorySlug(category: string): string {
  return category.toLowerCase();
}

export function relatedHeading(category: string): string {
  return category === 'Guides' ? 'More guides' : `More ${category.toLowerCase()} guides`;
}

export const CATEGORY_PAGE_TITLES: Record<string, string> = {
  Painting: 'Painting cost guides',
  Wallpaper: 'Wallpaper cost guides',
  Kitchen: 'Kitchen cost guides',
  Storage: 'Storage cost guides',
  Guides: 'Renter & budgeting guides',
};
