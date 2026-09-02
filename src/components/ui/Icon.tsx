import { Search, Mail, KeyRound, Trash2, RefreshCw } from 'lucide-react';

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
  'refresh-cw': RefreshCw,
} as const;

type IconName = keyof typeof iconMap;

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  // Object.hasOwn (rather than a bare truthy check on iconMap[name]) keeps a
  // caller-supplied name like "constructor" or "toString" from resolving
  // through the object prototype chain to something that isn't an icon
  // component and crashing the render below.
  if (!Object.hasOwn(iconMap, name)) return null;
  const LucideIcon = iconMap[name as IconName];
  return <LucideIcon size={size} />;
}
