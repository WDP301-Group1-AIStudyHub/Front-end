import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function AuthCardShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  subtitle: string
  title: string
}) {
  return (
    <Card className="w-[min(100%,520px)] p-7 sm:p-10">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-3xl font-semibold leading-tight">{title}</CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  )
}
