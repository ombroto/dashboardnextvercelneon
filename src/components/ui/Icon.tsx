import { Search, Mail, KeyRound, Trash2 } from 'lucide-react';

// Explicit map of only the icons actually used across the codebase (checked via
// `icon="..."` usages in Input/IconButton consumers). A namespace import
// (`import * as icons from 'lucide-react'`) can't be tree-shaken by any bundler
// because of the computed member lookup, so it used to ship the entire icon
// library to the client on every page that renders an Input or IconButton —
// including the public search page. Add new icons here explicitly as they're used.
const iconMap = {
  search: Search,
  mail: Mail,
  'key-round': KeyRound,
  'trash-2': Trash2,
} as const;

type IconName = keyof typeof iconMap;

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const LucideIcon = iconMap[name as IconName];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} />;
}
