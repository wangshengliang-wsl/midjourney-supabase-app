"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Sparkles, Zap, Clock, CheckCircle2, XCircle, History, Ban } from "lucide-react"
import { cn } from "@/lib/utils"

type RechargeOption = {
  amount: number
  credits: number
  label: string
  popular?: boolean
}

type PaymentRecord = {
  id: string
  out_trade_no: string
  trade_no: string | null
  amount: number
  credits: number
  payment_type: string
  status: 'pending' | 'success' | 'failed' | 'timeout' | 'cancelled'
  product_name: string
  created_at: string
  paid_at: string | null
}

const rechargeOptions: RechargeOption[] = [
  {
    amount: 1,
    credits: 1,
    label: '体验套餐',
  },
  {
    amount: 5,
    credits: 5,
    label: '超值套餐',
    popular: true,
  },
]

type RechargeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RechargeDialog({ open, onOpenChange, onSuccess }: RechargeDialogProps) {
  const [selectedOption, setSelectedOption] = useState<RechargeOption>(rechargeOptions[1])
  const [paymentType, setPaymentType] = useState<'alipay' | 'wxpay'>('alipay')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('recharge')
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
  })

  // Fetch payment history when switching to history tab
  useEffect(() => {
    if (open && activeTab === 'history') {
      fetchPaymentHistory()
    }
  }, [open, activeTab])

  const fetchPaymentHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch('/api/payment/history?limit=10')
      const data = await response.json()

      if (response.ok) {
        setPaymentHistory(data.payments || [])
      } else {
        console.error('Fetch payment history error:', data.error)
      }
    } catch (error) {
      console.error('Fetch payment history error:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleRecharge = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/payment/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedOption.amount,
          credits: selectedOption.credits,
          paymentType: paymentType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败')
      }

      // Redirect to payment page
      window.location.href = data.paymentUrl
    } catch (error) {
      console.error('Recharge error:', error)
      setAlertConfig({
        title: '充值失败',
        description: error instanceof Error ? error.message : '充值失败，请重试',
        onConfirm: () => {},
      })
      setAlertOpen(true)
      setIsLoading(false)
    }
  }

  const handleContinuePay = async (payment: PaymentRecord) => {
    try {
      const response = await fetch('/api/payment/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payment.amount,
          credits: payment.credits,
          paymentType: payment.payment_type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建订单失败')
      }

      // Redirect to payment page
      window.location.href = data.paymentUrl
    } catch (error) {
      console.error('Continue payment error:', error)
      setAlertConfig({
        title: '继续支付失败',
        description: error instanceof Error ? error.message : '继续支付失败，请重试',
        onConfirm: () => {},
      })
      setAlertOpen(true)
    }
  }

  const handleCancelOrder = (orderNo: string) => {
    setAlertConfig({
      title: '取消订单',
      description: '确定要取消这个订单吗？取消后将无法继续支付。',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/payment/order/${orderNo}`, {
            method: 'POST',
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || '取消订单失败')
          }

          // Refresh history
          await fetchPaymentHistory()
        } catch (error) {
          console.error('Cancel order error:', error)
          setAlertConfig({
            title: '操作失败',
            description: error instanceof Error ? error.message : '取消订单失败',
            onConfirm: () => {},
          })
          setAlertOpen(true)
        }
      },
    })
    setAlertOpen(true)
  }

  const handleDeleteOrder = (orderNo: string) => {
    setAlertConfig({
      title: '删除记录',
      description: '确定要删除这条充值记录吗？此操作无法撤销。',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/payment/order/${orderNo}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || '删除订单失败')
          }

          // Refresh history
          await fetchPaymentHistory()
        } catch (error) {
          console.error('Delete order error:', error)
          setAlertConfig({
            title: '操作失败',
            description: error instanceof Error ? error.message : '删除订单失败',
            onConfirm: () => {},
          })
          setAlertOpen(true)
        }
      },
    })
    setAlertOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />成功</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />失败</Badge>
      case 'timeout':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />超时</Badge>
      case 'cancelled':
        return <Badge variant="secondary"><Ban className="h-3 w-3 mr-1" />已取消</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />待支付</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            充值点数
          </DialogTitle>
          <DialogDescription>
            选择充值金额或查看充值历史
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recharge">账户充值</TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              充值历史
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recharge" className="space-y-6 py-4">
          {/* 充值选项 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">选择套餐</label>
            <div className="grid grid-cols-2 gap-3">
              {rechargeOptions.map((option) => (
                <Card
                  key={option.amount}
                  className={cn(
                    "relative cursor-pointer border-2 p-4 transition-all hover:shadow-md",
                    selectedOption.amount === option.amount
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedOption(option)}
                >
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      推荐
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <div className="font-bold text-2xl">{option.credits} 点</div>
                    <div className="text-sm text-muted-foreground">{option.label}</div>
                    <div className="text-lg font-semibold text-primary">¥{option.amount}</div>
                  </div>
                  {selectedOption.amount === option.amount && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* 支付方式 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">支付方式</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentType === 'alipay' ? 'default' : 'outline'}
                className="h-12"
                onClick={() => setPaymentType('alipay')}
              >
                支付宝
              </Button>
              <Button
                variant={paymentType === 'wxpay' ? 'default' : 'outline'}
                className="h-12"
                onClick={() => setPaymentType('wxpay')}
              >
                微信支付
              </Button>
            </div>
          </div>

          {/* 确认按钮 */}
          <Button
            className="w-full h-12 text-base"
            onClick={handleRecharge}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                跳转中...
              </>
            ) : (
              <>
                立即支付 ¥{selectedOption.amount}
              </>
            )}
          </Button>

            <p className="text-xs text-center text-muted-foreground">
              支付成功后，点数将自动充值到您的账户
            </p>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">暂无充值记录</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  完成首次充值后，记录将显示在这里
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {paymentHistory.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {payment.product_name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            订单号：{payment.out_trade_no}
                          </CardDescription>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">金额</p>
                          <p className="font-semibold text-primary">¥{payment.amount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">点数</p>
                          <p className="font-semibold">{payment.credits} 点</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">创建时间</p>
                          <p className="text-xs">{formatDate(payment.created_at)}</p>
                        </div>
                        {payment.paid_at && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-xs">支付时间</p>
                            <p className="text-xs">{formatDate(payment.paid_at)}</p>
                          </div>
                        )}
                        {payment.payment_type && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-xs">支付方式</p>
                            <p className="text-xs">
                              {payment.payment_type === 'alipay' ? '支付宝' : '微信支付'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-2 border-t">
                        {payment.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleContinuePay(payment)}
                            >
                              继续支付
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleCancelOrder(payment.out_trade_no)}
                            >
                              取消订单
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                              onClick={() => handleDeleteOrder(payment.out_trade_no)}
                            >
                              删除
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full"
                            onClick={() => handleDeleteOrder(payment.out_trade_no)}
                          >
                            删除记录
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* 确认对话框 */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                alertConfig.onConfirm()
                setAlertOpen(false)
              }}
            >
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

