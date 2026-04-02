import { SidebarTrigger } from '@/components/ui/sidebar';
import { SupabaseStatus } from '@/components/supabase-status';

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <SupabaseStatus />
      </div>
    </header>
  );
}
