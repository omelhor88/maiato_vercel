import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Printer, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const Insurance = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [viewReceiptOpen, setViewReceiptOpen] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all");
  const [viewReceiptData, setViewReceiptData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    premio_total: "",
    data_pagamento: "",
    recebido_maiato: false,
    pago_companhia: false,
    estorno: false,
    numero_recibo_companhia: "",
    apolice_numero: "",
    customer_id: "",
  });

  // Fetch insurance receipts with customer and insurance data
  const { data: insuranceReceipts } = useQuery({
    queryKey: ["insurance-receipts-main"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch customer and insurance details for each receipt
      const receiptsWithDetails = await Promise.all(
        (data || []).map(async (receipt: any) => {
          let customerName = "-";
          let insuranceCompanyName = "-";
          let insuranceCompanyCodigo = "";
          
          if (receipt.customer_id) {
            const { data: customerData } = await supabase
              .from("customers")
              .select("name")
              .eq("id", receipt.customer_id)
              .maybeSingle();
            customerName = customerData?.name || "-";
          }
          
          // Fetch insurance to get company info
          if (receipt.apolice_numero) {
            const { data: insuranceData } = await supabase
              .from("insurance")
              .select("insurance_company_codigo, insurance_companies(nome)")
              .eq("numero_apolice", receipt.apolice_numero)
              .maybeSingle();
            
            if (insuranceData) {
              insuranceCompanyName = (insuranceData as any).insurance_companies?.nome || "-";
              insuranceCompanyCodigo = insuranceData.insurance_company_codigo || "";
            }
          }
          
          return {
            ...receipt,
            customer_name: customerName,
            insurance_company_name: insuranceCompanyName,
            insurance_company_codigo: insuranceCompanyCodigo,
          };
        })
      );
      
      return receiptsWithDetails;
    },
  });

  // Fetch insurance policies for dropdown
  const { data: insurancePolicies } = useQuery({
    queryKey: ["insurance-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance")
        .select("numero, numero_apolice, customer_id, customers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: insuranceCompanies } = useQuery({
    queryKey: ["insurance_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_companies").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate receipt number
      const { data: lastReceipt } = await supabase
        .from("insurance_receipts")
        .select("numero_recibo_seg")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let receiptNumber = `SEG-${format(new Date(), "yyyyMMdd")}-001`;
      if (lastReceipt?.numero_recibo_seg) {
        const parts = lastReceipt.numero_recibo_seg.split("-");
        const lastNumber = parseInt(parts[2] || "0");
        receiptNumber = `SEG-${format(new Date(), "yyyyMMdd")}-${String(lastNumber + 1).padStart(3, "0")}`;
      }
      
      const receiptData: any = {
        numero_recibo_seg: receiptNumber,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        recebido_maiato: data.recebido_maiato || false,
        pago_companhia: data.pago_companhia || false,
        estorno: data.estorno || false,
      };
      
      if (data.apolice_numero) receiptData.apolice_numero = data.apolice_numero;
      if (data.customer_id) receiptData.customer_id = data.customer_id;
      if (data.numero_recibo_companhia) receiptData.numero_recibo_companhia = data.numero_recibo_companhia;
      if (data.data_pagamento) receiptData.data_pagamento = data.data_pagamento;
      
      if (data.premio_total) {
        const premioValue = parseFloat(data.premio_total);
        receiptData.premio_total = data.estorno ? -Math.abs(premioValue) : premioValue;
      }
      
      const { error } = await supabase.from("insurance_receipts").insert([receiptData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-receipts-main"] });
      toast.success("Recibo criado com sucesso");
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao criar recibo");
    },
  });

  const updateReceiptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const updateData: any = {
        recebido_maiato: data.recebido_maiato || false,
        pago_companhia: data.pago_companhia || false,
        estorno: data.estorno || false,
      };
      
      if (data.apolice_numero) updateData.apolice_numero = data.apolice_numero;
      if (data.numero_recibo_companhia) updateData.numero_recibo_companhia = data.numero_recibo_companhia;
      if (data.data_pagamento) updateData.data_pagamento = data.data_pagamento;
      
      if (data.premio_total) {
        const premioValue = parseFloat(data.premio_total);
        updateData.premio_total = data.estorno ? -Math.abs(premioValue) : premioValue;
      }
      
      const { error } = await supabase
        .from("insurance_receipts")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-receipts-main"] });
      toast.success("Recibo atualizado");
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar recibo");
    },
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("insurance_receipts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-receipts-main"] });
      toast.success("Recibo apagado com sucesso");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao apagar recibo");
    },
  });

  const resetForm = () => {
    setFormData({
      premio_total: "",
      data_pagamento: "",
      recebido_maiato: false,
      pago_companhia: false,
      estorno: false,
      numero_recibo_companhia: "",
      apolice_numero: "",
      customer_id: "",
    });
    setEditingId(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateReceiptMutation.mutate({ id: editingId, data: formData });
    } else {
      createReceiptMutation.mutate(formData);
    }
  };

  const handleEdit = (receipt: any) => {
    setEditingId(receipt.id);
    setFormData({
      premio_total: receipt.premio_total ? Math.abs(receipt.premio_total).toString() : "",
      data_pagamento: receipt.data_pagamento || "",
      recebido_maiato: receipt.recebido_maiato || false,
      pago_companhia: receipt.pago_companhia || false,
      estorno: receipt.estorno || false,
      numero_recibo_companhia: receipt.numero_recibo_companhia || "",
      apolice_numero: receipt.apolice_numero || "",
      customer_id: receipt.customer_id || "",
    });
    setOpen(true);
  };

  const toggleReceiptSelection = (id: string) => {
    setSelectedReceipts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePrintSelected = () => {
    if (selectedReceipts.size === 0) {
      toast.error("Selecione pelo menos um recibo");
      return;
    }
    const selectedIds = Array.from(selectedReceipts);
    navigate(`/insurance-print?ids=${selectedIds.join(",")}`);
  };

  // Filter by week and company
  const now = new Date();
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const pendingReceipts = useMemo(() => {
    return insuranceReceipts?.filter(r => {
      const isReceivedNotPaid = r.recebido_maiato === true && r.pago_companhia === false;
      const matchesCompany = selectedCompanyFilter === "all" || r.insurance_company_codigo === selectedCompanyFilter;
      return isReceivedNotPaid && matchesCompany;
    });
  }, [insuranceReceipts, selectedCompanyFilter]);

  const lastWeekReceipts = useMemo(() => {
    return insuranceReceipts?.filter(r => {
      if (!r.created_at) return false;
      const createdDate = new Date(r.created_at);
      const isInWeek = isWithinInterval(createdDate, { start: lastWeekStart, end: lastWeekEnd });
      const matchesCompany = selectedCompanyFilter === "all" || r.insurance_company_codigo === selectedCompanyFilter;
      return isInWeek && matchesCompany;
    });
  }, [insuranceReceipts, selectedCompanyFilter, lastWeekStart, lastWeekEnd]);

  const renderReceiptTable = (receipts: any[] | undefined, emptyMessage: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Seguradora</TableHead>
          <TableHead>Apólice</TableHead>
          <TableHead>Nº Recibo</TableHead>
          <TableHead>Prémio Total</TableHead>
          <TableHead>Data Pagamento</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {receipts && receipts.length > 0 ? (
          receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell>
                <Checkbox
                  checked={selectedReceipts.has(receipt.id)}
                  onCheckedChange={() => toggleReceiptSelection(receipt.id)}
                />
              </TableCell>
              <TableCell>{receipt.customer_name}</TableCell>
              <TableCell>{receipt.insurance_company_name}</TableCell>
              <TableCell>{receipt.apolice_numero || "-"}</TableCell>
              <TableCell>{receipt.numero_recibo_seg}</TableCell>
              <TableCell>
                {receipt.estorno ? (
                  <span className="text-destructive">-€{Math.abs(receipt.premio_total || 0).toFixed(2)}</span>
                ) : (
                  `€${Number(receipt.premio_total || 0).toFixed(2)}`
                )}
              </TableCell>
              <TableCell>
                {receipt.data_pagamento 
                  ? new Date(receipt.data_pagamento).toLocaleDateString("pt-PT") 
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
                  <Button variant="ghost" size="sm" onClick={() => {
                    setViewReceiptData(receipt);
                    setViewReceiptOpen(true);
                  }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(receipt)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (confirm("Tem certeza que deseja apagar este recibo?")) {
                        deleteReceiptMutation.mutate(receipt.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recibos de Seguros</h1>
          <p className="text-muted-foreground">Gestão de recibos de seguros</p>
        </div>
        <div className="flex gap-2">
          {selectedReceipts.size > 0 && (
            <Button onClick={handlePrintSelected} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir ({selectedReceipts.size})
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Recibo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Recibo" : "Novo Recibo de Seguro"}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Apólice</Label>
                    <Select value={formData.apolice_numero} onValueChange={(value) => setFormData({ ...formData, apolice_numero: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione apólice" />
                      </SelectTrigger>
                      <SelectContent>
                        {insurancePolicies?.map((p) => (
                          <SelectItem key={p.numero} value={p.numero_apolice || ""}>
                            {p.numero_apolice} - {(p as any).customers?.name || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prémio Total *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.premio_total}
                      onChange={(e) => setFormData({ ...formData, premio_total: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número Recibo Companhia</Label>
                    <Input
                      value={formData.numero_recibo_companhia}
                      onChange={(e) => setFormData({ ...formData, numero_recibo_companhia: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data Pagamento</Label>
                    <Input
                      type="date"
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="estorno"
                      checked={formData.estorno}
                      onCheckedChange={(checked) => setFormData({ ...formData, estorno: !!checked })}
                    />
                    <Label htmlFor="estorno" className="cursor-pointer">
                      É Estorno? (valor será negativo)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="recebido_maiato"
                      checked={formData.recebido_maiato} 
                      onCheckedChange={(checked) => setFormData({ ...formData, recebido_maiato: !!checked })}
                    />
                    <Label htmlFor="recebido_maiato" className="cursor-pointer">Recebido (Pago)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pago_companhia"
                      checked={formData.pago_companhia} 
                      onCheckedChange={(checked) => setFormData({ ...formData, pago_companhia: !!checked })}
                    />
                    <Label htmlFor="pago_companhia" className="cursor-pointer">Pago Companhia</Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button type="submit">Guardar Recibo</Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4">
        <Label>Filtrar por Seguradora</Label>
        <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todas as seguradoras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as seguradoras</SelectItem>
            {insuranceCompanies?.map((company) => (
              <SelectItem key={company.codigo} value={company.codigo}>
                {company.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="last-week">Semana Anterior</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recibos Pendentes (Recebidos mas não pagos à companhia)</h2>
            {renderReceiptTable(pendingReceipts, "Nenhum recibo pendente encontrado")}
          </Card>
        </TabsContent>

        <TabsContent value="last-week">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recibos da Semana Anterior</h2>
            {renderReceiptTable(lastWeekReceipts, "Nenhum recibo encontrado")}
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Receipt Dialog */}
      <Dialog open={viewReceiptOpen} onOpenChange={setViewReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Recibo</DialogTitle>
          </DialogHeader>
          {viewReceiptData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número Recibo</Label>
                  <p className="text-sm">{viewReceiptData.numero_recibo_seg}</p>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <p className="text-sm">{viewReceiptData.customer_name}</p>
                </div>
                <div>
                  <Label>Seguradora</Label>
                  <p className="text-sm">{viewReceiptData.insurance_company_name}</p>
                </div>
                <div>
                  <Label>Apólice</Label>
                  <p className="text-sm">{viewReceiptData.apolice_numero || "-"}</p>
                </div>
                <div>
                  <Label>Prémio Total</Label>
                  <p className="text-sm">€{Math.abs(viewReceiptData.premio_total || 0).toFixed(2)}</p>
                </div>
                {viewReceiptData.data_pagamento && (
                  <div>
                    <Label>Data Pagamento</Label>
                    <p className="text-sm">{new Date(viewReceiptData.data_pagamento).toLocaleDateString("pt-PT")}</p>
                  </div>
                )}
                {viewReceiptData.numero_recibo_companhia && (
                  <div>
                    <Label>Nº Recibo Companhia</Label>
                    <p className="text-sm">{viewReceiptData.numero_recibo_companhia}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {viewReceiptData.recebido_maiato ? (
                  <Badge className="bg-green-500 text-white">Pago</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>
                )}
                {viewReceiptData.estorno && (
                  <Badge variant="destructive">Estorno</Badge>
                )}
                {viewReceiptData.pago_companhia && (
                  <Badge className="bg-green-600 text-white">Pago Companhia</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Insurance;
