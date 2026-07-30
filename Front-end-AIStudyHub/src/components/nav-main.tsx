import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: ReactNode
  isActive?: boolean
  children?: NavItem[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenItems((current) => {
      let changed = false
      const next = { ...current }

      for (const item of items) {
        if (item.children?.length && item.isActive && next[item.title] === undefined) {
          next[item.title] = true
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [items])

  return (
    <SidebarMenu>
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length)
        const isOpen = openItems[item.title] ?? Boolean(item.isActive)

        if (hasChildren) {
          return (
            <Collapsible
              key={item.title}
              onOpenChange={(open) =>
                setOpenItems((current) => ({ ...current, [item.title]: open }))
              }
              open={isOpen}
            >
              <SidebarMenuItem className="relative">
                <SidebarMenuButton
                  asChild
                  className="px-3 pr-8 active:translate-y-px"
                  isActive={item.isActive}
                >
                  <Link to={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction
                    aria-label={`Toggle ${item.title}`}
                    className="right-2 data-[state=open]:rotate-90"
                  >
                    <ChevronRight />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children?.map((child) => (
                      <SidebarMenuSubItem key={child.title}>
                        <SidebarMenuSubButton asChild isActive={child.isActive}>
                          <Link to={child.url}>
                            {child.icon}
                            <span>{child.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

        return (
          <SidebarMenuItem key={item.title} className="relative">
            <SidebarMenuButton asChild isActive={item.isActive} className="px-3 active:translate-y-px">
              <Link to={item.url}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
