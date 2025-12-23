import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeNif } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";


interface CustomerReceiptsNewProps {
  customerId: string;
}

export const CustomerReceiptsNew = ({ customerId }: CustomerReceiptsNewProps) => {
  const queryClient = useQueryClient();
  
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [receiptFormData, setReceiptFormData] = useState({
    type: "contabilidade",
    sub_type: "",
    amount: "",
    description: "",
    issue_date: new Date().toISOString().split("T")[0],
    paid_date: "",
    notes: "",
  });

  const { data: customer } = useQuery({
    queryKey: ["customer-nif", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("nif")
        .eq("id", customerId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const customerNif = customer?.nif ?? "";
  const customerNifNormalized = normalizeNif(customerNif);
  const customerNifCandidates = Array.from(
    new Set([customerNif, customerNifNormalized].filter(Boolean))
  );

  const { data: receipts } = useQuery({
    queryKey: ["customer-accounting-receipts", customerId, customerNifNormalized],
    enabled: customerNifCandidates.length > 0,
    queryFn: async () => {
      let receiptsQuery = supabase
        .from("receipts")
        .select("*, customers!inner(nif)")
        .eq("type", "contabilidade");

      if (customerNifCandidates.length === 1) {
        receiptsQuery = receiptsQuery.eq("customers.nif", customerNifCandidates[0]);
      } else {
        receiptsQuery = receiptsQuery.or(
          customerNifCandidates.map((n) => `nif.eq.${n}`).join(","),
          { foreignTable: "customers" }
        );
      }

      const { data, error } = await receiptsQuery.order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const createReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: lastReceipt } = await supabase
        .from("receipts")
        .select("receipt_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let receiptNumber = `REC-${format(new Date(), "yyyyMMdd")}-001`;
      if (lastReceipt?.receipt_number) {
        const lastNumber = parseInt(lastReceipt.receipt_number.split("-")[2]);
        receiptNumber = `REC-${format(new Date(), "yyyyMMdd")}-${String(lastNumber + 1).padStart(3, "0")}`;
      }

      const { error } = await supabase.from("receipts").insert([{
        ...data,
        customer_id: customerId,
        user_id: user?.id,
        receipt_number: receiptNumber,
        amount: parseFloat(data.amount),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-accounting-receipts", customerId] });
      toast.success("Recibo criado com sucesso");
      resetReceiptForm();
    },
  });

  const updateReceiptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updateData: any = { ...data, amount: parseFloat(data.amount) };
      
      const { error } = await supabase
        .from("receipts")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-accounting-receipts", customerId] });
      toast.success("Recibo atualizado");
      resetReceiptForm();
    },
  });

  const resetReceiptForm = () => {
    setReceiptFormData({
      type: "contabilidade",
      sub_type: "",
      amount: "",
      description: "",
      issue_date: new Date().toISOString().split("T")[0],
      paid_date: "",
      notes: "",
    });
    setEditingReceiptId(null);
    setReceiptOpen(false);
  };

  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...receiptFormData,
      status: receiptFormData.paid_date ? "paid" : "pending",
      paid_date: receiptFormData.paid_date || null,
    };
    
    if (editingReceiptId) {
      updateReceiptMutation.mutate({ id: editingReceiptId, data: submitData });
    } else {
      createReceiptMutation.mutate(submitData);
    }
  };

  const handleEditReceipt = (receipt: any) => {
    setEditingReceiptId(receipt.id);
    setReceiptFormData({
      type: receipt.type,
      sub_type: receipt.sub_type || "",
      amount: receipt.amount.toString(),
      description: receipt.description || "",
      issue_date: receipt.issue_date,
      paid_date: receipt.paid_date || "",
      notes: receipt.notes || "",
    });
    setReceiptOpen(true);
  };

  const statusColors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
    paid: "default",
    pending: "secondary",
    overdue: "destructive",
  };

  const statusLabels = {
    paid: "Pago",
    pending: "Pendente",
    overdue: "Atrasado",
  };

  const pendingReceiptsTotal = receipts
    ?.filter(r => r.status !== 'paid')
    .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  const paidReceiptsTotal = receipts
    ?.filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

  const sortedReceipts = [...(receipts || [])].sort((a, b) => {
    if (a.status !== 'paid' && b.status === 'paid') return -1;
    if (a.status === 'paid' && b.status !== 'paid') return 1;
    return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recibos de Contabilidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg flex flex-wrap gap-6">
            <p className="text-sm font-medium">
              Total Pendentes: <span className="text-lg font-bold text-orange-600">€{pendingReceiptsTotal.toFixed(2)}</span>
            </p>
            <p className="text-sm font-medium">
              Total Pagos: <span className="text-lg font-bold text-green-600">€{paidReceiptsTotal.toFixed(2)}</span>
            </p>
          </div>
          
          <div className="flex justify-end">
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { resetReceiptForm(); setReceiptOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Recibo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingReceiptId ? "Editar Recibo" : "Novo Recibo"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleReceiptSubmit} className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      O número do recibo será gerado automaticamente
                    </p>
                  </div>
                  <div>
                    <Label>Sub-Tipo *</Label>
                    <Select value={receiptFormData.sub_type} onValueChange={(value) => setReceiptFormData({ ...receiptFormData, sub_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sub-tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IRS e derivados">IRS e derivados</SelectItem>
                        <SelectItem value="Empresas e TI">Empresas e TI</SelectItem>
                        <SelectItem value="Consultoria">Consultoria</SelectItem>
                        <SelectItem value="Diversos">Diversos</SelectItem>
                        <SelectItem value="Pagamentos">Pagamentos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição do Serviço *</Label>
                    <Textarea
                      value={receiptFormData.description}
                      onChange={(e) => setReceiptFormData({ ...receiptFormData, description: e.target.value })}
                      placeholder="Detalhe o serviço prestado..."
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={receiptFormData.amount}
                      onChange={(e) => setReceiptFormData({ ...receiptFormData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Data de Emissão *</Label>
                    <Input
                      type="date"
                      value={receiptFormData.issue_date}
                      onChange={(e) => setReceiptFormData({ ...receiptFormData, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Data de Pagamento</Label>
                    <Input
                      type="date"
                      value={receiptFormData.paid_date}
                      onChange={(e) => setReceiptFormData({ ...receiptFormData, paid_date: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se inserir data de pagamento, o recibo será marcado como pago
                    </p>
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <Textarea
                      value={receiptFormData.notes}
                      onChange={(e) => setReceiptFormData({ ...receiptFormData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setReceiptOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Recibo</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Sub-Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReceipts?.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{receipt.receipt_number}</TableCell>
                  <TableCell>{receipt.sub_type}</TableCell>
                  <TableCell>€{Number(receipt.amount).toFixed(2)}</TableCell>
                  <TableCell>{new Date(receipt.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[receipt.status as keyof typeof statusColors] || "default"}>
                      {statusLabels[receipt.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setViewReceiptOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditReceipt(receipt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* View Receipt Dialog */}
        <Dialog open={viewReceiptOpen} onOpenChange={setViewReceiptOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Recibo</DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número</Label>
                    <p className="text-sm">{selectedReceipt.receipt_number}</p>
                  </div>
                  <div>
                    <Label>Sub-Tipo</Label>
                    <p className="text-sm">{selectedReceipt.sub_type}</p>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <p className="text-sm">€{Number(selectedReceipt.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Data Emissão</Label>
                    <p className="text-sm">{new Date(selectedReceipt.issue_date).toLocaleDateString()}</p>
                  </div>
                  {selectedReceipt.paid_date && (
                    <div>
                      <Label>Data Pagamento</Label>
                      <p className="text-sm">{new Date(selectedReceipt.paid_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {selectedReceipt.description && (
                  <div>
                    <Label>Descrição</Label>
                    <p className="text-sm">{selectedReceipt.description}</p>
                  </div>
                )}
                {selectedReceipt.notes && (
                  <div>
                    <Label>Notas</Label>
                    <p className="text-sm">{selectedReceipt.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};