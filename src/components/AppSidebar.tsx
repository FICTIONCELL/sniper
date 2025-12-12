import {
  Building2,
  Layers3,
  AlertTriangle,
  Users,
  CheckCircle,
  Calendar,
  BarChart3,
  FolderOpen,
  ClipboardCheck,
  Tags,
  Settings,
  LayoutGrid,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation();
  const { userEmail } = useGoogleDrive();
  const currentPath = location.pathname;

  const collapsed = state === "collapsed";

  const menuItems = [
    { title: t('dashboard'), url: "/", icon: BarChart3 },
    { title: t('projects'), url: "/projects", icon: Building2 },
    { title: t('buildings'), url: "/buildings", icon: Layers3 },
    { title: t('reserves'), url: "/reserves", icon: AlertTriangle },
    { title: t('contractors'), url: "/contractors", icon: Users },
    { title: t('resolveReserves'), url: "/resolve-reserves", icon: CheckCircle },
    { title: t('receptions'), url: "/receptions", icon: ClipboardCheck },
    { title: t('tasks'), url: "/tasks", icon: FolderOpen },
    { title: t('planning'), url: "/planning", icon: Calendar },
    { title: "Documents", url: "/documents", icon: FolderOpen },
    { title: t('categories'), url: "/categories", icon: Tags },
    { title: t('settings'), url: "/settings", icon: Settings },
  ];

  // Admin-only email
  const isAdmin = userEmail === 'fictionsell@gmail.com';

  // Add Admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({ title: "Admin", url: "/admin", icon: Shield });
  }

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>


              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <motion.div
                        className="flex items-center w-full"
                        whileHover={{ x: 4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </motion.div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}