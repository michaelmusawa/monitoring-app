import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button"; // Adjust path as needed

interface SubmitButtonProps {
  children?: React.ReactNode;
  className?: string;
  isPending: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  className,
  isPending,
}) => {
  return (
    <>
      {isPending ? (
        <Button
          type="submit"
          disabled
          className={cn("flex w-40 gap-2", className)}
        >
          <Loader2 className="size-4 animate-spin" />
          <span>Pending...</span>
        </Button>
      ) : (
        <Button type="submit" className={cn("flex w-40 gap-2", className)}>
          {children}
        </Button>
      )}
    </>
  );
};

export default SubmitButton;
