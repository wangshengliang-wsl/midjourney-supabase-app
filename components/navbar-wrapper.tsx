"use client"

import React from "react"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { Home, User, MessageCircle, LogIn } from "lucide-react"

export function NavbarWrapper() {
  const navItems = [
    {
      name: "首页",
      link: "/",
      icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "关于",
      link: "/about",
      icon: <User className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "支持",
      link: "/support",
      icon: <MessageCircle className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "登陆",
      link: "/sign-in",
      icon: <LogIn className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
  ]

  return <FloatingNav navItems={navItems} />
}

