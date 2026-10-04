import type { ButtonHTMLAttributes } from "react";
export function buttonClass(variant: "primary" | "outline" = "primary") { return `button button--${variant}`; }
export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) {
  return <button type="button" className={`${buttonClass(variant)} ${className}`} {...props}/>;
}
