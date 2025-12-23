import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FileText, LogOut, Shield, BarChart3, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userRole } = useUserRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão terminada");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Página Inicial", roles: ["admin", "employee"] },
    { to: "/customers", icon: Users, label: "Clientes", roles: ["admin", "employee"] },
    { to: "/insurance", icon: Shield, label: "Seguros", roles: ["admin"] },
    { to: "/receipts", icon: FileText, label: "Recibos", roles: ["admin"] },
    { to: "/cash-register", icon: Wallet, label: "Caixa", roles: ["admin"] },
    { to: "/analytics", icon: BarChart3, label: "Análise", roles: ["admin"] },
    { to: "/employees", icon: Users, label: "Funcionários", roles: ["admin"] },
    { to: "/reference-data", icon: Shield, label: "Dados Referência", roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || !userRole || item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card print:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-primary">Maiato - Sistema de Gestão</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>
      <div className="container mx-auto flex gap-6 px-4 py-6">
        <aside className="w-64 space-y-2 print:hidden">
          {filteredNavItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant={location.pathname === item.to ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
