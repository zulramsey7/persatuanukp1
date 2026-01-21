import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface FloatingCardProps extends HTMLMotionProps<"div"> {
  variant?: "glass" | "solid";
  hover?: boolean;
}

const FloatingCard = forwardRef<HTMLDivElement, FloatingCardProps>(
  ({ className, variant = "glass", hover = true, children, ...props }, ref) => {
    const baseStyles = variant === "glass" 
      ? "floating-card" 
      : "floating-card-solid";

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          hover && "hover-lift",
          "p-6",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FloatingCard.displayName = "FloatingCard";

export { FloatingCard };
