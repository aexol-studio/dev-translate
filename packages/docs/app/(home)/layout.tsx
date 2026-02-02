import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { layoutOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HomeLayout {...layoutOptions}>{children}</HomeLayout>;
}
