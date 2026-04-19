"use client";

import { useState } from "react";
import { CalendarClock, Goal, Target } from "lucide-react";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { EmptyState } from "@/components/empty-state";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalModal } from "@/features/goals/components/GoalModal";
import { savingsGoalStatusLabels } from "@/features/goals/constants/goal.constants";
import { useGoals } from "@/features/goals/hooks/useGoals";
import type { SavingsGoal } from "@/features/goals/types/Goal";
import { formatCurrency } from "@/lib/format";

export function GoalsView() {
  const { goals, summary, error, isPending, createGoal, updateGoal, deleteGoal } = useGoals();
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <SectionHeader
        eyebrow="Goals"
        title="Turn balances into milestones"
        description="Track what each savings target still needs, how funded it already is, and which goals are quietly getting stale."
        action={<GoalModal onSubmit={createGoal} />}
      />

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface">
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Saved So Far</p>
              <p className="financial-figure text-2xl font-semibold text-primary">
                {formatCurrency(summary.totalSavedAmount, summary.primaryCurrencyCode)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Target Total</p>
              <p className="financial-figure text-2xl font-semibold text-foreground">
                {formatCurrency(summary.totalTargetAmount, summary.primaryCurrencyCode)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface-raised">
            <CardContent className="space-y-2 px-6 py-5">
              <p className="text-sm text-muted">Completed Goals</p>
              <p className="financial-figure text-2xl font-semibold text-secondary">
                {summary.completedCount.toFixed(0)} / {summary.goalCount.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <ConfirmationModal
        open={goalToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setGoalToDelete(null);
          }
        }}
        title="Delete Goal"
        description={goalToDelete ? `This will remove the ${goalToDelete.name} goal.` : "This action cannot be undone."}
        confirmLabel="Delete Goal"
        onConfirm={async () => {
          if (goalToDelete) {
            await deleteGoal(goalToDelete.id);
          }
        }}
      />

      {isPending && goals.length === 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="Create a goal that your money can move toward"
          description="Savings goals stay visible alongside live balances so short-term spending choices stay connected to long-term outcomes."
          action="Add Goal"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {goals.map((goal) => {
            const clampedProgress = Math.min(goal.progressPercent, 100);

            return (
              <Card key={goal.id} className="border-border bg-surface">
                <CardContent className="space-y-5 px-6 py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10 text-secondary">
                        <Goal className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{goal.name}</p>
                        <p className="text-sm text-muted">{savingsGoalStatusLabels[goal.status]}</p>
                      </div>
                    </div>
                    <Badge variant={goal.isCompleted ? "success" : "info"}>
                      {goal.isCompleted ? "Funded" : `${clampedProgress.toFixed(0)}%`}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="financial-figure text-xl font-semibold text-foreground">
                      {formatCurrency(goal.savedAmount, goal.currencyCode)} / {formatCurrency(goal.targetAmount, goal.currencyCode)}
                    </p>
                    <div className="h-3 rounded-full bg-accent-muted">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{ width: `${clampedProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-primary">{goal.progressPercent.toFixed(2)}% funded</p>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-background/30 p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Target className="h-4 w-4 text-secondary" />
                      <span className="text-muted">Remaining</span>
                      <span className="financial-figure ml-auto text-foreground">
                        {formatCurrency(goal.remainingAmount, goal.currencyCode)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CalendarClock className="h-4 w-4 text-secondary" />
                      <span className="text-muted">Target Date</span>
                      <span className="ml-auto text-foreground">{goal.targetDate ?? "No deadline"}</span>
                    </div>
                  </div>

                  {goal.notes ? <p className="text-sm text-muted">{goal.notes}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    <GoalModal
                      goal={goal}
                      onSubmit={async (input) => {
                        await updateGoal(goal.id, input);
                      }}
                    />
                    <Button type="button" variant="secondary" className="text-error hover:text-error" onClick={() => setGoalToDelete(goal)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
