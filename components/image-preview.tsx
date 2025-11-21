"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

type ImagePreviewProps = {
  images: { id: string; url: string; prompt: string }[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (url: string, index: number) => void
}

export function ImagePreview({ images, initialIndex, open, onOpenChange, onDownload }: ImagePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black/95 border-none">
        <Carousel
          opts={{
            startIndex: initialIndex,
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.id}>
                <div className="relative flex flex-col items-center justify-center p-8">
                  {/* 图片 */}
                  <div className="relative w-full max-h-[80vh] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                  </div>
                  
                  {/* 底部信息栏 */}
                  <div className="mt-6 w-full max-w-2xl space-y-3">
                    <p className="text-white/90 text-sm text-center line-clamp-2">
                      {image.prompt}
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => onDownload(image.url, index)}
                      >
                        <Download className="h-4 w-4" />
                        下载图片
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* 左右箭头 */}
          <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 border-white/20 text-white" />
          <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 border-white/20 text-white" />
        </Carousel>
        
        {/* 右上角关闭按钮 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors z-50"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </DialogContent>
    </Dialog>
  )
}

