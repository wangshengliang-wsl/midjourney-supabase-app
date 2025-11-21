'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ImageIcon, Loader2, Plus, Sparkles, Zap, Download } from 'lucide-react'
import { ImageSkeleton } from '@/components/ui/image-skeleton'
import { ImagePreview } from '@/components/image-preview'
import { RechargeDialog } from '@/components/recharge-dialog'
import { PaymentVerifyDialog } from '@/components/payment-verify-dialog'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

// 生成的图片数据类型
type GeneratedImage = {
  id: string
  url: string
  prompt: string
}

// 任务状态类型
type TaskStatus = 'PENDING' | 'RUNNING' | 'SUSPENDED' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN'

export default function ProtectedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [credits, setCredits] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [paymentVerifyOpen, setPaymentVerifyOpen] = useState(false)
  const [orderNo, setOrderNo] = useState<string | null>(null)

  // Check for payment callback
  useEffect(() => {
    const order = searchParams.get('order')
    if (order) {
      setOrderNo(order)
      setPaymentVerifyOpen(true)
    }
  }, [searchParams])

  // Fetch user credits on mount
  useEffect(() => {
    fetchCredits()
    fetchHistory()
  }, [])

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true)
      const response = await fetch('/api/credits')
      const data = await response.json()

      if (response.ok) {
        setCredits(data.credits || 0)
      } else {
        console.error('Fetch credits error:', data.error)
      }
    } catch (error) {
      console.error('Fetch credits error:', error)
    } finally {
      setIsLoadingCredits(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch('/api/history?limit=1')
      const data = await response.json()

      if (response.ok && data.history && data.history.length > 0) {
        const latestRecord = data.history[0]
        if (latestRecord.status === 'completed' && latestRecord.image_urls) {
          const images = latestRecord.image_urls.map((url: string, index: number) => ({
            id: `${latestRecord.id}-${index}`,
            url: url,
            prompt: latestRecord.prompt,
          }))
          setGeneratedImages(images)
          setCurrentPrompt(latestRecord.prompt)
        }
      }
    } catch (error) {
      console.error('Fetch history error:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Poll task status until completed
  const pollTaskStatus = async (taskId: string): Promise<GeneratedImage[]> => {
    const maxAttempts = 60 // Maximum 60 attempts (60 seconds)
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/check-task/${taskId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '查询任务失败')
        }

        const status: TaskStatus = data.output?.task_status

        if (status === 'SUCCEEDED') {
          // Extract image URLs from results
          const results = data.output?.results || []
          return results.map((result: any, index: number) => ({
            id: `${taskId}-${index}`,
            url: result.url,
            prompt: result.orig_prompt || prompt,
          }))
        } else if (status === 'FAILED') {
          throw new Error('图片生成失败')
        }

        // Task is still pending/running, wait 1 second before next check
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      } catch (error) {
        console.error('Poll error:', error)
        throw error
      }
    }

    throw new Error('生成超时，请稍后重试')
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setAlertMessage('请输入提示词')
      setAlertOpen(true)
      return
    }

    if (credits <= 0) {
      setAlertMessage('点数不足，请充值')
      setAlertOpen(true)
      return
    }

    setIsGenerating(true)
    setCurrentPrompt(prompt)
    setGeneratedImages([]) // Clear previous results

    try {
      // Step 1: Create task (credits will be deducted in API)
      const createResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(createData.error || '创建任务失败')
      }

      const taskId = createData.output?.task_id
      if (!taskId) {
        throw new Error('未获取到任务ID')
      }

      // Step 2: Poll for results
      const images = await pollTaskStatus(taskId)

      setGeneratedImages(images)

      // Refresh credits and history after successful generation
      await fetchCredits()
      await fetchHistory()
    } catch (error) {
      console.error('Generation error:', error)
      setAlertMessage(error instanceof Error ? error.message : '生成图片失败，请重试')
      setAlertOpen(true)
      setGeneratedImages([])

      // Refresh credits in case of error (might have been refunded)
      await fetchCredits()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `ai-image-${Date.now()}-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download error:', error)
      setAlertMessage('下载失败，请重试')
      setAlertOpen(true)
    }
  }

  const handlePaymentVerifyClose = () => {
    setPaymentVerifyOpen(false)
    setOrderNo(null)

    // Remove order parameter from URL
    router.replace('/protected')

    // Refresh credits
    fetchCredits()
  }

  const handleRechargeSuccess = () => {
    fetchCredits()
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* 顶部输入区域 */}
      <div className="w-full sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full md:w-auto">
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="输入提示词，例如：一只在太空中飞行的赛博朋克猫..."
                className="pl-10 h-12 text-base shadow-sm"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border">
              <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium text-sm">{credits} 点数</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setRechargeOpen(true)}>
                <Plus className="h-4 w-4" />
                充值
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="min-w-[100px]">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中
                  </>
                ) : (
                  '生成图片'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 图片展示区域 */}
      <div className="flex-1">
        {isGenerating ? (
          // 生成中：显示单个生成区域
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">正在生成</h2>
                <p className="text-muted-foreground max-w-md mx-auto line-clamp-2">&quot;{currentPrompt}&quot;</p>
                <p className="text-sm text-muted-foreground/70">AI 正在为您创作，预计需要 30-60 秒...</p>
              </div>
            </div>
          </div>
        ) : generatedImages.length === 0 ? (
          // 空状态：占位卡片
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="aspect-square border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => document.querySelector('input')?.focus()}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center h-full">
                  <div className="p-4 rounded-full bg-muted">
                    <ImageIcon className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">
                    输入提示词开始生成
                    <br />
                    <span className="text-xs opacity-70 mt-1 block">探索无限创意</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // 生成结果展示
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">生成结果</h2>
              <span className="text-sm text-muted-foreground truncate max-w-[300px]">&quot;{currentPrompt}&quot;</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {generatedImages.map((img, index) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setPreviewIndex(index)
                    setPreviewOpen(true)
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.prompt} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                  {/* 悬浮操作栏 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full h-8 text-xs bg-white/90 hover:bg-white gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(img.url, index)
                      }}
                    >
                      <Download className="h-3 w-3" />
                      下载图片
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 图片预览弹框 */}
      <ImagePreview images={generatedImages} initialIndex={previewIndex} open={previewOpen} onOpenChange={setPreviewOpen} onDownload={handleDownload} />

      {/* 充值弹框 */}
      <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} onSuccess={handleRechargeSuccess} />

      {/* 支付验证弹框 */}
      {orderNo && <PaymentVerifyDialog orderNo={orderNo} open={paymentVerifyOpen} onClose={handlePaymentVerifyClose} onSuccess={handleRechargeSuccess} />}

      {/* 提示对话框 */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
