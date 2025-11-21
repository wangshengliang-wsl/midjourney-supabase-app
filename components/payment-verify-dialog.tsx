"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react"

type PaymentStatus = 'pending' | 'success' | 'failed' | 'timeout'

type PaymentVerifyDialogProps = {
  orderNo: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentVerifyDialog({ orderNo, open, onClose, onSuccess }: PaymentVerifyDialogProps) {
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [credits, setCredits] = useState(0)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!open || !orderNo) return

    let intervalId: NodeJS.Timeout
    const maxAttempts = 30 // 30 seconds

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment/check/${orderNo}`)
        const data = await response.json()

        if (response.ok) {
          if (data.status === 'success') {
            setStatus('success')
            setCredits(data.credits)
            clearInterval(intervalId)
            
            // Call success callback after a short delay
            setTimeout(() => {
              onSuccess?.()
            }, 2000)
          } else if (data.status === 'failed') {
            setStatus('failed')
            clearInterval(intervalId)
          }
        }

        setAttempts((prev) => prev + 1)

        // Stop after max attempts
        if (attempts >= maxAttempts) {
          setStatus('timeout')
          clearInterval(intervalId)
        }
      } catch (error) {
        console.error('Check payment error:', error)
      }
    }

    // Initial check
    checkPaymentStatus()

    // Poll every 1 second
    intervalId = setInterval(checkPaymentStatus, 1000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [open, orderNo, attempts, onSuccess])

  const handleClose = () => {
    setStatus('pending')
    setAttempts(0)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>支付验证</DialogTitle>
          <DialogDescription>
            正在验证您的支付状态...
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {status === 'pending' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                等待支付确认... ({attempts}/30)
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">支付成功！</h3>
                <p className="text-sm text-muted-foreground">
                  已充值 {credits} 点数到您的账户
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                开始创作
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">支付失败</h3>
                <p className="text-sm text-muted-foreground">
                  支付过程中出现问题，请重试
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                关闭
              </Button>
            </>
          )}

          {status === 'timeout' && (
            <>
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-3">
                <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">验证超时</h3>
                <p className="text-sm text-muted-foreground">
                  未能及时确认支付状态，请稍后在历史记录中查看
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                关闭
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

