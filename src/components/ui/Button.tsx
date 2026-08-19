import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    isLoading?: boolean
    tooltip?: string
}

const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'hover:bg-slate-100 text-slate-600',
    link: 'text-blue-600 underline-offset-4 hover:underline p-0 h-auto',
    success: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", isLoading = false, tooltip, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                title={tooltip}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
                    variants[variant],
                    {
                        "border border-slate-200 bg-white hover:bg-slate-100": variant === "outline",
                        "bg-slate-100 text-slate-900 hover:bg-slate-200": variant === "secondary",
                        "hover:bg-slate-100": variant === "ghost",
                        "text-blue-600 underline-offset-4 hover:underline": variant === "link",
                        "h-10 px-4": size === "default",
                        "h-9 px-3": size === "sm",
                        "h-11 px-8": size === "lg",
                        "h-10 w-10": size === "icon",
                    },
                    className
                )}
                {...props}
            >

                <span className={cn("flex items-center", isLoading && "opacity-70")}>
                    {children}
                </span>

                {isLoading && (
                    <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="opacity-25"
                        />
                        <path
                            fill="currentColor"
                            className="opacity-75"
                            d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2z"
                        />
                    </svg>
                )}

            </button>
        )
    }
)

Button.displayName = "Button"

export { Button }