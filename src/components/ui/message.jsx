import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Markdown } from "./markdown"

const Message = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
)

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className
}) => {
  return (
    <Avatar className={cn("h-8 w-8 shrink-0", className)}>
      <AvatarImage src={src} alt={alt} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}

const MessageContent = ({
  children,
  markdown = false,
  role = 'system',
  className,
  ...props
}) => {
  const baseClasses = "px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap max-w-none";
  
  // Clean Nuxt UI aesthetic: solid soft color for user, minimal/transparent for system
  const roleClasses = role === 'user' 
    ? "rounded-2xl bg-white/10 text-white rounded-br-sm"
    : "text-gray-200 prose prose-invert";

  const classNames = cn(baseClasses, roleClasses, className);

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

const MessageActions = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn("text-muted-foreground flex items-center gap-2", className)}
    {...props}>
    {children}
  </div>
)

const MessageAction = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Message, MessageAvatar, MessageContent, MessageActions, MessageAction }
