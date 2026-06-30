import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        let Icon = null
        if (props.variant === "success") {
          Icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        } else if (props.variant === "destructive") {
          Icon = <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
        } else if (props.variant === "warning") {
          Icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        } else if (props.variant === "info") {
          Icon = <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        }

        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3 items-start flex-1">
              {Icon}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
