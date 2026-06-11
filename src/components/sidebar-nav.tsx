
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Shield, ShieldAlert, ClipboardCheck, BookText, Users, Newspaper, Zap, Cpu, Lightbulb, BrainCircuit } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { href: '/policies', label: 'Policies', icon: Shield },
  { href: '/sops', label: 'SOPs', icon: BookText },
  { href: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { href: '/policy-insights', label: 'Policy Insights', icon: ClipboardCheck },
  { href: '/user-insights', label: 'User Insights', icon: Users },
  { href: '/ai-efficiency', label: 'AI vs Human Efficiency', icon: Zap },
  { href: '/ai-usage', label: 'AI Usage', icon: Cpu },
  { href: '/prompt-library-insights', label: 'Prompt Library Insights', icon: Lightbulb },
  { href: '/policy-confidence', label: 'Policy Confidence', icon: BrainCircuit },
  { href: '/kb-article', label: 'KB Article', icon: Newspaper },
];

export function SidebarNav() {
  const pathname = usePathname();

  const isItemVisible = (item: typeof navItems[number]) => {
    if (item.href === '/ai-usage') return false;
    return true;
  };

  return (
    <SidebarMenu>
      {navItems.filter(isItemVisible).map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
            <Link href={item.href}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
