import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeNif } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";


interface CustomerInsuranceReceiptsProps {
  customerId: string;
}

export const CustomerInsuranceReceipts = ({ customerId }: CustomerInsuranceReceiptsProps) => {
  const queryClient = useQueryClient();
  
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [editReceiptOpen, setEditReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  
  const [editFormData, setEditFormData] = useState({
    premio_total: "",
    data_pagamento: "",
    recebido_maiato: false,
    pago_companhia: false,
    estorno: false,
    numero_recibo_companhia: "",
  });

  const { data: receipts } = useQuery({
    queryKey: ["customer-insurance-receipts", customerId],
    queryFn: async () => {
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("nif")
        .eq("id", customerId)
        .maybeSingle();
      if (customerError) throw customerError;

      const customerNif = customerData?.nif ?? "";
      const customerNifNormalized = normalizeNif(customerNif);
      const customerNifCandidates = Array.from(
        new Set([customerNif, customerNifNormalized].filter(Boolean))
      );

      if (customerNifCandidates.length === 0) return [];

      let policiesQuery = supabase.from("insurance").select("numero_apolice");
      policiesQuery =
        customerNifCandidates.length === 1
          ? policiesQuery.eq("nif", customerNifCandidates[0])
          : policiesQuery.in("nif", customerNifCandidates);

      const { data: policies, error: policiesError } = await policiesQuery;
      if (policiesError) throw policiesError;

      const apolices = (policies || [])
        .map((p: any) => p.numero_apolice)
        .filter(Boolean) as string[];

      if (apolices.length === 0) return [];

      const { data, error } = await supabase
        .from("insurance_receipts")
        .select("*")
        .in("apolice_numero", apolices)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const updateReceiptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updateData: any = {
        recebido_maiato: data.recebido_maiato || false,
        pago_companhia: data.pago_companhia || false,
        estorno: data.estorno || false,
      };
      
      if (data.premio_total) {
        const premioValue = parseFloat(data.premio_total);
        updateData.premio_total = data.estorno ? -Math.abs(premioValue) : premioValue;
      }
      if (data.data_pagamento) updateData.data_pagamento = data.data_pagamento;
      if (data.numero_recibo_companhia) updateData.numero_recibo_companhia = data.numero_recibo_companhia;
      
      const { error } = await supabase
        .from("insurance_receipts")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-insurance-receipts", customerId] });
      toast.success("Recibo atualizado");
      setEditReceiptOpen(false);
    },
  });

  const handleEditReceipt = (receipt: any) => {
    setSelectedReceipt(receipt);
    setEditFormData({
      premio_total: receipt.premio_total ? Math.abs(receipt.premio_total).toString() : "",
      data_pagamento: receipt.data_pagamento || "",
      recebido_maiato: receipt.recebido_maiato || false,
      pago_companhia: receipt.pago_companhia || false,
      estorno: receipt.estorno || false,
      numero_recibo_companhia: receipt.numero_recibo_companhia || "",
    });
    setEditReceiptOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReceipt) {
      updateReceiptMutation.mutate({ id: selectedReceipt.id, data: editFormData });
    }
  };

  const pendingPremiosTotal = receipts
    ?.filter(r => !r.recebido_maiato && !r.estorno)
    .reduce((sum, r) => sum + Number(r.premio_total || 0), 0) || 0;

  const paidPremiosTotal = receipts
    ?.filter(r => r.recebido_maiato && !r.estorno)
    .reduce((sum, r) => sum + Number(r.premio_total || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recibos de Seguros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg flex flex-wrap gap-6">
            <p className="text-sm font-medium">
              Total Pendentes: <span className="text-lg font-bold text-orange-600">€{pendingPremiosTotal.toFixed(2)}</span>
            </p>
            <p className="text-sm font-medium">
              Total Pagos: <span className="text-lg font-bold text-green-600">€{paidPremiosTotal.toFixed(2)}</span>
            </p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Recibo</TableHead>
                <TableHead>Apólice</TableHead>
                <TableHead>Prémio</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts?.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{receipt.numero_recibo_seg}</TableCell>
                  <TableCell>{receipt.apolice_numero || "-"}</TableCell>
                  <TableCell>
                    {receipt.estorno ? (
                      <span className="text-destructive">-€{Math.abs(receipt.premio_total || 0).toFixed(2)}</span>
                    ) : (
                      `€${Number(receipt.premio_total || 0).toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    {receipt.data_pagamento 
                      ? new Date(receipt.data_pagamento).toLocaleDateString() 
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap items-center">
                      {receipt.recebido_maiato ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">Pago</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>
                      )}
                      {receipt.estorno && (
                        <Badge variant="destructive">Estorno</Badge>
                      )}
                      {receipt.pago_companhia && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">Pag. comp</Badge>
                      )}
                    </div>
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
              {(!receipts || receipts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum recibo de seguro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* View Receipt Dialog */}
        <Dialog open={viewReceiptOpen} onOpenChange={setViewReceiptOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Recibo</DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número Recibo</Label>
                    <p className="text-sm">{selectedReceipt.numero_recibo_seg}</p>
                  </div>
                  <div>
                    <Label>Apólice</Label>
                    <p className="text-sm">{selectedReceipt.apolice_numero || "-"}</p>
                  </div>
                  <div>
                    <Label>Prémio Total</Label>
                    <p className="text-sm">€{Math.abs(selectedReceipt.premio_total || 0).toFixed(2)}</p>
                  </div>
                  {selectedReceipt.data_pagamento && (
                    <div>
                      <Label>Data Pagamento</Label>
                      <p className="text-sm">{new Date(selectedReceipt.data_pagamento).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedReceipt.numero_recibo_companhia && (
                    <div>
                      <Label>Nº Recibo Companhia</Label>
                      <p className="text-sm">{selectedReceipt.numero_recibo_companhia}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedReceipt.estorno && (
                    <Badge variant="destructive">Este recibo é um estorno</Badge>
                  )}
                  {selectedReceipt.recebido_maiato && (
                    <Badge variant="default">Recebido Maiato</Badge>
                  )}
                  {selectedReceipt.pago_companhia && (
                    <Badge variant="secondary">Pago à Companhia</Badge>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Receipt Dialog */}
        <Dialog open={editReceiptOpen} onOpenChange={setEditReceiptOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Recibo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Prémio Total</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.premio_total}
                  onChange={(e) => setEditFormData({ ...editFormData, premio_total: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Número Recibo Companhia</Label>
                <Input
                  value={editFormData.numero_recibo_companhia}
                  onChange={(e) => setEditFormData({ ...editFormData, numero_recibo_companhia: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Pagamento</Label>
                <Input
                  type="date"
                  value={editFormData.data_pagamento}
                  onChange={(e) => setEditFormData({ ...editFormData, data_pagamento: e.target.value })}
                />
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="edit_estorno"
                  checked={editFormData.estorno}
                  onCheckedChange={(checked) => 
                    setEditFormData({ ...editFormData, estorno: checked === true })
                  }
                />
                <Label htmlFor="edit_estorno" className="cursor-pointer">É Estorno?</Label>
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox 
                  id="edit_recebido_maiato"
                  checked={editFormData.recebido_maiato} 
                  onCheckedChange={(checked) => {
                    setEditFormData({ 
                      ...editFormData, 
                      recebido_maiato: !!checked
                    });
                  }}
                />
                <Label htmlFor="edit_recebido_maiato" className="cursor-pointer">Recebido Maiato</Label>
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox 
                  id="edit_pago_companhia"
                  checked={editFormData.pago_companhia} 
                  onCheckedChange={(checked) => {
                    setEditFormData({ 
                      ...editFormData, 
                      pago_companhia: !!checked
                    });
                  }}
                />
                <Label htmlFor="edit_pago_companhia" className="cursor-pointer">Pago Companhia</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditReceiptOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
