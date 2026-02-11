import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "s" | "m" | "l" | "full";
    children: ReactNode;
}

export function Button({
    className,
    variant = "primary",
    size = "m",
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                styles.button,
                styles[variant],
                styles[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
