import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CustomerRemindersProps {
  customerId: string;
  customerName: string;
}

export const CustomerReminders = ({ customerId, customerName }: CustomerRemindersProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminder_date: format(new Date(), "yyyy-MM-dd"),
    reminder_time: "09:00",
  });

  const queryClient = useQueryClient();

  const { data: reminders } = useQuery({
    queryKey: ["customer-reminders", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("customer_id", customerId)
        .order("reminder_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const reminderDateTime = `${data.reminder_date}T${data.reminder_time}:00`;
      const { error } = await supabase.from("reminders").insert([{
        title: data.title,
        description: data.description,
        reminder_date: reminderDateTime,
        customer_id: customerId,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reminders", customerId] });
      toast.success("Lembrete criado com sucesso");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        reminder_date: format(new Date(), "yyyy-MM-dd"),
        reminder_time: "09:00",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("reminders").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reminders", customerId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reminders", customerId] });
      toast.success("Lembrete eliminado com sucesso");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lembretes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Lembrete para {customerName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reminder_date">Data *</Label>
                <Input
                  id="reminder_date"
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reminder_time">Hora *</Label>
                <Input
                  id="reminder_time"
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Criar Lembrete</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reminders?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum lembrete encontrado</p>
          )}
          {reminders?.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                checked={reminder.completed}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({ id: reminder.id, completed: checked as boolean })
                }
              />
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className={`font-medium ${reminder.completed ? "line-through text-muted-foreground" : ""}`}>
                  {reminder.title}
                </p>
                {reminder.description && (
                  <p className="text-sm text-muted-foreground">{reminder.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(reminder.reminder_date), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(reminder.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
