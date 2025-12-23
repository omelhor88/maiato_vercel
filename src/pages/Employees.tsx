import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Mail, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

const Employees = () => {
  const queryClient = useQueryClient();
  const { data: currentUserRole } = useUserRole();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; full_name: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "employee" as "admin" | "employee",
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          full_name
        `);
      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.user_id)
            .maybeSingle();

          return {
            ...user,
            role: roleData?.role || null,
          };
        })
      );

      return usersWithRoles;
    },
    enabled: currentUserRole === "admin",
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const authClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar utilizador");

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{ user_id: authData.user.id, role: data.role }]);

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Funcionário criado com sucesso");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar funcionário");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Funcionário removido");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover funcionário");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke('update-user-password', {
        body: { userId, newPassword },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      toast.success("Password atualizada com sucesso");
      setNewPassword("");
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar password");
    },
  });

  const fetchUserEmail = async (userId: string) => {
    setLoadingEmail(true);
    try {
      const response = await supabase.functions.invoke('get-user-email', {
        body: { userId },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      setUserEmail(response.data?.email || "Email não encontrado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao obter email");
      setUserEmail("Erro ao carregar");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleEditClick = async (user: { user_id: string; full_name: string }) => {
    setSelectedUser(user);
    setUserEmail("");
    setNewPassword("");
    setEditOpen(true);
    await fetchUserEmail(user.user_id);
  };

  const handlePasswordUpdate = () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return;
    }
    updatePasswordMutation.mutate({ userId: selectedUser.user_id, newPassword });
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      role: "employee",
    });
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground mt-2">
          Apenas administradores podem aceder a esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Funcionários</h1>
          <p className="text-muted-foreground">Gestão de utilizadores do sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Funcionário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "employee") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{user.full_name || "Sem nome"}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role === "admin" ? "Admin" : "Funcionário"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(user)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        "Tem a certeza que deseja remover este funcionário?"
                      )
                    ) {
                      deleteUserMutation.mutate(user.user_id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Funcionário: {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                value={loadingEmail ? "A carregar..." : userEmail}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Nova Password
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe vazio para manter a atual"
                minLength={6}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handlePasswordUpdate}
                disabled={!newPassword || updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? "A guardar..." : "Atualizar Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
