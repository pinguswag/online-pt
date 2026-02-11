import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className={styles.container}>
                {label && <label className={styles.label}>{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        styles.input,
                        error && styles.hasError,
                        className
                    )}
                    {...props}
                />
                {error && <p className={styles.error}>{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";
