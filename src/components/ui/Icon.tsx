import * as icons from 'lucide-react';
import { icons as iconRegistry } from 'lucide-react';

type IconName = keyof typeof iconRegistry;

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const componentName = toPascalCase(name) as keyof typeof icons;
  const LucideIcon = icons[componentName] as React.ComponentType<{ size?: number }> | undefined;
  if (!LucideIcon) return null;
  return <LucideIcon size={size} />;
}
