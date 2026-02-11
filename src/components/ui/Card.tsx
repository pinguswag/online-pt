import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div className={cn(styles.card, className)} {...props}>
            {children}
        </div>
    );
}
