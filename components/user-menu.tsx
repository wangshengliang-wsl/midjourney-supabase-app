"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Sparkles } from "lucide-react"

export function UserMenu() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getAvatarFallback = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const getAvatarUrl = (email: string) => {
    // Generate random avatar based on email
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${hash}`
  }

  if (loading) {
    return null
  }

  if (!user) {
    return (
      <div className="fixed top-6 right-6 z-50 flex gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">登录</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-up">注册</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed top-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={getAvatarUrl(user.email)} alt={user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getAvatarFallback(user.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">我的账户</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/protected" className="cursor-pointer">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>AI 创作中心</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

