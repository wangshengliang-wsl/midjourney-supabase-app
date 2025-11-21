import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">关于我们</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          我们致力于通过 AI 技术，让每个人都能轻松释放创造力。
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-center mb-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold">我们的使命</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            在数字艺术蓬勃发展的今天，我们相信创意的表达不应受到技术门槛的限制。
            我们的使命是构建最直观、最强大的 AI 创作工具，连接人类想象力与数字现实。
          </p>
          <div className="flex flex-col gap-3">
            {["降低创作门槛", "激发无限灵感", "社区驱动发展"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-muted rounded-2xl aspect-square flex items-center justify-center">
             <img 
              src="https://picsum.photos/seed/about/800/800" 
              alt="Team working" 
              className="w-full h-full object-cover rounded-2xl"
            />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>创新</CardTitle>
            <CardDescription>持续突破技术边界</CardDescription>
          </CardHeader>
          <CardContent>
            我们不断探索生成式 AI 的可能性，为用户带来前沿的创作体验。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>简洁</CardTitle>
            <CardDescription>以用户体验为核心</CardDescription>
          </CardHeader>
          <CardContent>
            拒绝复杂的操作流程，让工具回归本质，让创作回归纯粹。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>开放</CardTitle>
            <CardDescription>共建创意生态</CardDescription>
          </CardHeader>
          <CardContent>
            我们要建立一个开放的社区，让艺术家和创作者能够自由交流与分享。
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

