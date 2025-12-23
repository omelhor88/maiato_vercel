import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { AlertCircle, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface CustomerHistoryProps {
  customerId: string;
  customerNif: string;
}

export const CustomerHistory = ({ customerId, customerNif }: CustomerHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: historyRecords, isLoading } = useQuery({
    queryKey: ["historial", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial")
        .select("*")
        .eq("customer_id", customerId)
        .order("urgent", { ascending: false })
        .order("occurrence_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("historial").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historial", customerId] });
      toast.success("Histórico eliminado com sucesso");
    },
  });

  const handleEdit = (history: any) => {
    setEditingHistory(history);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja eliminar este histórico?")) {
      deleteMutation.mutate(id);
    }
  };

  const urgentUnresolved = historyRecords?.filter(h => h.urgent && !h.response) || [];
  const otherRecords = historyRecords?.filter(h => !h.urgent || h.response) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico do Cliente</h3>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setEditingHistory(null);
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingHistory ? "Editar Histórico" : "Novo Histórico"}
              </DialogTitle>
            </DialogHeader>
            <HistoryForm
              customerId={customerId}
              customerNif={customerNif}
              history={editingHistory}
              onSuccess={() => {
                setOpen(false);
                setEditingHistory(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : (
        <>
          {urgentUnresolved.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Urgentes Pendentes
              </h4>
              {urgentUnresolved.map((record) => (
                <HistoryCard
                  key={record.id}
                  record={record}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div className="space-y-2">
            {otherRecords.length > 0 ? (
              otherRecords.map((record) => (
                <HistoryCard
                  key={record.id}
                  record={record}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : urgentUnresolved.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum histórico registado
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

const HistoryCard = ({ record, onEdit, onDelete }: any) => {
  return (
    <Card className={`p-4 ${record.urgent && !record.response ? 'border-destructive' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">#{record.historial_number}</span>
            {record.urgent && !record.response && (
              <Badge variant="destructive">Urgente</Badge>
            )}
            {!record.viewed && <Badge variant="outline">Novo</Badge>}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Ocorrência:</p>
            <p className="text-sm">{record.occurrence}</p>
          </div>

          {record.response && (
            <div>
              <p className="text-sm text-muted-foreground">Resposta:</p>
              <p className="text-sm">{record.response}</p>
            </div>
          )}

          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Data: {format(new Date(record.occurrence_date), "dd/MM/yyyy")}</span>
            {record.nif && <span>NIF: {record.nif}</span>}
            <span>Atualizado: {format(new Date(record.updated_at), "dd/MM/yyyy HH:mm")}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(record)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(record.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const HistoryForm = ({ customerId, customerNif, history, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    occurrence: history?.occurrence || "",
    nif: history?.nif || customerNif,
    occurrence_date: history?.occurrence_date || new Date().toISOString().split('T')[0],
    response: history?.response || "",
    urgent: history?.urgent || false,
    viewed: history?.viewed || false,
  });

  const queryClient = useQueryClient();

  const { data: existingRecords } = useQuery({
    queryKey: ["historial-count", customerId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("historial")
        .select("*", { count: 'exact', head: true })
        .eq("customer_id", customerId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !history, // Only fetch count when creating new record
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (history) {
        const { error } = await supabase
          .from("historial")
          .update(data)
          .eq("id", history.id);
        if (error) throw error;
      } else {
        // Generate automatic historial number
        const nextNumber = (existingRecords || 0) + 1;
        const historialNumber = `H${nextNumber.toString().padStart(4, '0')}`;
        
        const { error } = await supabase
          .from("historial")
          .insert([{ 
            ...data,
            historial_number: historialNumber,
            customer_id: customerId,
            user_id: user?.id || '00000000-0000-0000-0000-000000000000'
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historial", customerId] });
      queryClient.invalidateQueries({ queryKey: ["historial-count", customerId] });
      toast.success(history ? "Histórico atualizado" : "Histórico criado");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {history && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              Nº Histórico: <strong>{history.historial_number}</strong>
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="occurrence_date">Data da Ocorrência *</Label>
          <Input
            id="occurrence_date"
            type="date"
            value={formData.occurrence_date}
            onChange={(e) => setFormData({ ...formData, occurrence_date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="nif">NIF</Label>
          <Input
            id="nif"
            value={formData.nif}
            onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="occurrence">Ocorrência *</Label>
          <Textarea
            id="occurrence"
            value={formData.occurrence}
            onChange={(e) => setFormData({ ...formData, occurrence: e.target.value })}
            required
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="response">Resposta</Label>
          <Textarea
            id="response"
            value={formData.response}
            onChange={(e) => setFormData({ ...formData, response: e.target.value })}
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgent"
              checked={formData.urgent}
              onCheckedChange={(checked) => setFormData({ ...formData, urgent: checked as boolean })}
            />
            <Label htmlFor="urgent" className="cursor-pointer">Urgente</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="viewed"
              checked={formData.viewed}
              onCheckedChange={(checked) => setFormData({ ...formData, viewed: checked as boolean })}
            />
            <Label htmlFor="viewed" className="cursor-pointer">Visto</Label>
          </div>
        </div>

        <Button type="submit" className="w-full">
          {history ? "Atualizar" : "Criar"} Histórico
        </Button>
      </form>
    </ScrollArea>
  );
};
