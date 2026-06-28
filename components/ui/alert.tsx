"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-gray-50 border-gray-200 text-gray-800",
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`rounded-lg border p-4 text-sm ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h5
        ref={ref}
        className={`font-medium mb-1 ${className}`}
        {...props}
      >
        {children}
      </h5>
    );
  }
);

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <p ref={ref} className={`text-sm opacity-90 ${className}`} {...props}>
        {children}
      </p>
    );
  }
);

AlertDescription.displayName = "AlertDescription";
