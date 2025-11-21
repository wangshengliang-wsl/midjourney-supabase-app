import { ThemeSwitcher } from '@/components/theme-switcher'
import { UserMenu } from '@/components/user-menu'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <UserMenu />
      <main className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">{children}</main>
    </div>
  )
}
