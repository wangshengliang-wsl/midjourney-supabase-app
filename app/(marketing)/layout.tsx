import { NavbarWrapper } from '@/components/navbar-wrapper'
import { UserMenu } from '@/components/user-menu'
import React from 'react'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarWrapper />
      <UserMenu />
      <main className="flex-1">{children}</main>
    </div>
  )
}
