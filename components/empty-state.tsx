import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  action: string;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-surface-raised/60">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-accent-muted text-secondary">
          <Inbox className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tightest text-foreground">{title}</h3>
          <p className="max-w-md text-sm text-muted">{description}</p>
        </div>
        <Button>{action}</Button>
      </CardContent>
    </Card>
  );
}
