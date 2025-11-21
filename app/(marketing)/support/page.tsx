import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle, Phone } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">支持中心</h1>
        <p className="text-xl text-muted-foreground">
          遇到问题？我们在这里为您提供帮助。
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-16">
        <Card>
          <CardHeader>
            <CardTitle>常见问题</CardTitle>
            <CardDescription>快速找到您需要的答案</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>如何开始使用？</AccordionTrigger>
                <AccordionContent>
                  只需注册账号，在首页输入您的创意描述，点击生成即可。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>生成的图片可以商用吗？</AccordionTrigger>
                <AccordionContent>
                  是的，您生成的图片完全属于您，可以用于商业用途。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>如何提升生成质量？</AccordionTrigger>
                <AccordionContent>
                  尝试使用更详细的描述词，包含风格、光照、构图等细节。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>联系我们</CardTitle>
            <CardDescription>发送消息，我们将尽快回复</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">留言内容</Label>
              <Textarea id="message" placeholder="请描述您遇到的问题..." />
            </div>
            <Button className="w-full">发送消息</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 text-center">
        <div className="p-6 bg-muted/50 rounded-lg flex flex-col items-center gap-3 hover:bg-muted transition-colors">
          <Mail className="h-8 w-8 text-primary" />
          <h3 className="font-medium">邮件支持</h3>
          <p className="text-sm text-muted-foreground">support@example.com</p>
        </div>
        <div className="p-6 bg-muted/50 rounded-lg flex flex-col items-center gap-3 hover:bg-muted transition-colors">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h3 className="font-medium">在线客服</h3>
          <p className="text-sm text-muted-foreground">周一至周五 9:00-18:00</p>
        </div>
        <div className="p-6 bg-muted/50 rounded-lg flex flex-col items-center gap-3 hover:bg-muted transition-colors">
          <Phone className="h-8 w-8 text-primary" />
          <h3 className="font-medium">电话咨询</h3>
          <p className="text-sm text-muted-foreground">400-123-4567</p>
        </div>
      </div>
    </div>
  );
}

