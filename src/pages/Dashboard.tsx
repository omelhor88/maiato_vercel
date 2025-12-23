import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    title: "",
    description: "",
    reminder_date: "",
  });

  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, customers(name)")
        .order("reminder_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("reminders").insert([{
        ...data,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Lembrete criado");
      resetForm();
    },
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("reminders")
        .update({ completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Lembrete removido");
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      title: "",
      description: "",
      reminder_date: "",
    });
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReminderMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral e lembretes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lembrete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Lembrete</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit">Criar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lembretes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders?.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={reminder.completed}
                    onCheckedChange={(checked) => toggleReminderMutation.mutate({ id: reminder.id, completed: !!checked })}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${reminder.completed ? "line-through text-muted-foreground" : ""}`}>
                        {reminder.title}
                      </h4>
                      {reminder.customers && (
                        <Badge variant="outline">{reminder.customers.name}</Badge>
                      )}
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(reminder.reminder_date).toLocaleString("pt-PT")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminderMutation.mutate(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {!reminders?.length && (
                <p className="text-center text-muted-foreground py-8">Sem lembretes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default Dashboard;
