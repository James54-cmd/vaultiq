'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function hasDialogTitleNode(children: React.ReactNode): boolean {
  let found = false

  React.Children.forEach(children, (child) => {
    if (found) return
    if (!React.isValidElement(child)) return

    // Matches our exported `DialogTitle` (adds data-slot) and direct Radix usage.
    const slot = (child.props as any)?.['data-slot']
    if (slot === 'dialog-title' || child.type === DialogPrimitive.Title) {
      found = true
      return
    }

    const nested = (child.props as any)?.children
    if (nested) {
      if (hasDialogTitleNode(nested)) found = true
    }
  })

  return found
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  backdropBlur = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & {
  backdropBlur?: boolean
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        backdropBlur ? 'backdrop-blur-sm' : '',
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  backdropBlur = false,
  a11yTitle = 'Dialog',
  requireExplicitClose = false,
  onEscapeKeyDown,
  onInteractOutside,
  onPointerDownOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  backdropBlur?: boolean
  /** Screen-reader title if no `DialogTitle` is provided. */
  a11yTitle?: string
  /** Prevent closing from escape or outside interaction. */
  requireExplicitClose?: boolean
}) {
  const hasTitle = hasDialogTitleNode(children)

  const handleEscapeKeyDown: React.ComponentProps<
    typeof DialogPrimitive.Content
  >['onEscapeKeyDown'] = (event) => {
    if (requireExplicitClose) {
      event.preventDefault()
    }

    onEscapeKeyDown?.(event)
  }

  const handleInteractOutside: React.ComponentProps<
    typeof DialogPrimitive.Content
  >['onInteractOutside'] = (event) => {
    if (requireExplicitClose) {
      event.preventDefault()
    }

    onInteractOutside?.(event)
  }

  const handlePointerDownOutside: React.ComponentProps<
    typeof DialogPrimitive.Content
  >['onPointerDownOutside'] = (event) => {
    if (requireExplicitClose) {
      event.preventDefault()
    }

    onPointerDownOutside?.(event)
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay backdropBlur={backdropBlur} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-4 z-50 flex w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] max-w-lg -translate-x-1/2 flex-col gap-0 overflow-hidden rounded-lg border p-0 shadow-lg duration-200',
          className
        )}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside}
        onPointerDownOutside={handlePointerDownOutside}
        {...props}>
        {!hasTitle && (
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>{a11yTitle}</DialogPrimitive.Title>
          </VisuallyHidden.Root>
        )}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'mt-auto flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
