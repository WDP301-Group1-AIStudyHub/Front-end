import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function AuthCardShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold leading-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
