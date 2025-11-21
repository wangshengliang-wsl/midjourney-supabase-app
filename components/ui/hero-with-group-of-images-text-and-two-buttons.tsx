'use client'

import { MoveRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

function Hero() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)

  const handleGetStarted = async () => {
    setIsChecking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      router.push('/protected')
    } else {
      router.push('/login')
    }
    setIsChecking(false)
  }
  const fadeInUps = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="w-full py-20 lg:py-40 overflow-hidden bg-background text-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          {/* 左侧文本区域 */}
          <motion.div className="flex gap-8 flex-col" initial="hidden" animate="visible" transition={{ staggerChildren: 0.2 }}>
            <motion.div variants={fadeInUps}>
              <Badge variant="outline" className="px-4 py-1 text-base backdrop-blur-sm bg-background/50">
                ✨ AI 驱动创作
              </Badge>
            </motion.div>

            <motion.div className="flex gap-6 flex-col" variants={fadeInUps}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-left bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                用文字创造
                <br />
                <span className="text-primary">视觉奇迹</span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-lg text-left">
                只需输入一段描述，AI 即可为您生成精美的图像。
                <br className="hidden md:block" />
                无需专业设计技能，让创意即刻呈现。
                <br className="hidden md:block" />
                从概念到作品，只需几秒钟。
              </p>
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-4" variants={fadeInUps}>
              <Button
                size="lg"
                className="gap-2 h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                onClick={handleGetStarted}
                disabled={isChecking}
              >
                {isChecking ? '加载中...' : '立即开始'} <MoveRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* 右侧图片网格区域 */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 relative">
            {/* 装饰背景元素 */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 via-blue-500/10 to-purple-500/20 blur-3xl rounded-full opacity-50" />

            <motion.div
              className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl border border-border/50 bg-muted"
              initial={{ opacity: 0, scale: 0.8, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              whileHover={{ scale: 1.05, rotate: -2 }}
            >
              <img src="https://picsum.photos/seed/art1/800/800" alt="AI Generated Abstract Art" className="object-cover w-full h-full" />
            </motion.div>

            <motion.div
              className="relative row-span-2 overflow-hidden rounded-2xl shadow-2xl border border-border/50 bg-muted"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <img src="https://picsum.photos/seed/art2/800/1200" alt="AI Generated Creative Art" className="object-cover w-full h-full" />
            </motion.div>

            <motion.div
              className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl border border-border/50 bg-muted"
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
            >
              <img src="https://picsum.photos/seed/art3/800/800" alt="AI Generated Visual Art" className="object-cover w-full h-full" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Hero }
