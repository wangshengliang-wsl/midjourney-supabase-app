"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Loader2, Plus, Sparkles, Zap } from "lucide-react";
import Image from "next/image";

// 模拟生成的图片数据
type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
};

export default function ProtectedPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(5);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt) return;
    if (credits <= 0) {
      alert("点数不足，请充值");
      return;
    }

    setIsGenerating(true);
    
    // 模拟生成过程
    setTimeout(() => {
      const newImages = Array(4).fill(null).map((_, i) => ({
        id: Date.now().toString() + i,
        // 使用 Picsum 获取随机图片，添加随机参数防止缓存
        url: `https://picsum.photos/seed/${Date.now() + i}/1024/1024`,
        prompt: prompt
      }));

      setGeneratedImages(newImages);
      setCredits(prev => prev - 1);
      setIsGenerating(false);
    }, 2000);
  };

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
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border">
              <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium text-sm">{credits} 点数</span>
            </div>
            
            <div className="flex gap-2">
               <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                充值
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt}
                className="min-w-[100px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中
                  </>
                ) : (
                  "生成图片"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 图片展示区域 */}
      <div className="flex-1">
        {generatedImages.length === 0 ? (
          // 空状态：占位卡片
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="aspect-square border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center h-full">
                  <div className="p-4 rounded-full bg-muted">
                    <ImageIcon className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">
                    输入提示词开始生成<br/>
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
              <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                &quot;{generatedImages[0].prompt}&quot;
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {generatedImages.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all">
                  {/* 使用普通的 img 标签以确保外部图片能直接显示，或者配置 next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  
                  {/* 悬浮操作栏 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                    <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-white/90 hover:bg-white">
                      下载图片
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
