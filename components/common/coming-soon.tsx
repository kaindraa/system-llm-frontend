import type { FC } from "react";
import { Calendar } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

export const ComingSoon: FC<ComingSoonProps> = ({ title }) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        <p className="text-lg text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
};
