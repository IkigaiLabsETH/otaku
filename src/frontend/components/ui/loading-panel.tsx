import { Bullet } from "./bullet";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface LoadingPanelProps {
  title: string;
  messages: string[];
}

export function LoadingPanel({ title, messages }: LoadingPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <Card className="w-full max-w-md mx-4 bg-background">
      <CardHeader className="flex items-center justify-between pl-3 pr-1">
        <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
        <Bullet />
        {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-pop">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052FF]"></div>
          {messages.map((message) => (
                <p className="text-sm text-muted-foreground text-center">
                    {message}
                </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  </div>


  );
}

