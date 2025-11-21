import { Card } from "@/components/ui/card";

export function ImageSkeleton() {
  return (
    <Card className="aspect-square overflow-hidden relative border bg-muted/30">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">生成中...</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

