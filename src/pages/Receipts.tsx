import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Receipts = () => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "contabilidade" | "seguros">("all");
  const [sortBy, setSortBy] = useState<"issue_date" | "paid_date" | "status">("issue_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [formData, setFormData] = useState({
    customer_id: "",
    type: "contabilidade",
    sub_type: "",
    amount: "",
    description: "",
    issue_date: new Date().toISOString().split("T")[0],
    paid_date: "",
    status: "pending",
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: receipts } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*, customers(name)")
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: insuranceReceipts } = useQuery({
    queryKey: ["insurance-receipts-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch customer names for each receipt
      const receiptsWithCustomers = await Promise.all(
        (data || []).map(async (rec: any) => {
          let customerName = "-";
          if (rec.customer_id) {
            const { data: customerData } = await supabase
              .from("customers")
              .select("name")
              .eq("id", rec.customer_id)
              .maybeSingle();
            customerName = customerData?.name || "-";
          }
          
          return {
            id: rec.id,
            receipt_number: rec.numero_recibo_seg,
            type: "seguros",
            is_insurance_receipt: true,
            customer_id: rec.customer_id,
            customers: { name: customerName },
            description: rec.apolice_numero ? `Apólice: ${rec.apolice_numero}` : "Recibo Seguro",
            amount: rec.premio_total || 0,
            issue_date: rec.created_at,
            paid_date: rec.data_pagamento,
            status: rec.recebido_maiato ? "paid" : "pending",
            created_at: rec.created_at,
            updated_at: rec.updated_at,
            insurance_receipt_data: rec,
          };
        })
      );
      
      return receiptsWithCustomers;
    },
  });

  const allReceipts = [
    ...(receipts || []),
    ...(typeFilter === "seguros" || typeFilter === "all" ? insuranceReceipts || [] : [])
  ];

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const generateReceiptNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";
    
    const today = new Date();
    const datePrefix = today.toISOString().split("T")[0].replace(/-/g, "");
    
    const { data: lastReceipt } = await supabase
      .from("receipts")
      .select("receipt_number")
      .eq("user_id", user.id)
      .like("receipt_number", `REC-${datePrefix}-%`)
      .order("receipt_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let nextNumber = 1;
    if (lastReceipt?.receipt_number) {
      const lastNumber = parseInt(lastReceipt.receipt_number.split("-")[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `REC-${datePrefix}-${String(nextNumber).padStart(4, "0")}`;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      if (editMode && editingReceiptId) {
        // Update existing receipt
        const submitData = {
          customer_id: data.customer_id,
          type: data.type,
          sub_type: data.sub_type,
          amount: parseFloat(data.amount),
          description: data.description,
          issue_date: data.issue_date,
          paid_date: data.paid_date || null,
          status: data.paid_date ? "paid" : data.status,
          notes: data.notes,
        };
        
        const { error } = await supabase
          .from("receipts")
          .update(submitData)
          .eq("id", editingReceiptId);
        if (error) throw error;
      } else {
        // Create new receipt
        const receipt_number = await generateReceiptNumber();
        
        const submitData = {
          customer_id: data.customer_id,
          type: data.type,
          sub_type: data.sub_type,
          amount: parseFloat(data.amount),
          description: data.description,
          issue_date: data.issue_date,
          paid_date: data.paid_date || null,
          status: data.paid_date ? "paid" : data.status,
          notes: data.notes,
          user_id: user.id,
          receipt_number,
        };
        
        const { error } = await supabase.from("receipts").insert([submitData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success(editMode ? "Recibo atualizado com sucesso" : "Recibo criado com sucesso");
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("receipts")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Estado atualizado com sucesso");
      setEditingReceipt(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("receipts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Recibo apagado com sucesso");
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      type: "contabilidade",
      sub_type: "",
      amount: "",
      description: "",
      issue_date: new Date().toISOString().split("T")[0],
      paid_date: "",
      status: "pending",
      notes: "",
    });
    setEditMode(false);
    setEditingReceiptId(null);
  };

  const handleEdit = (receipt: any) => {
    setFormData({
      customer_id: receipt.customer_id,
      type: receipt.type,
      sub_type: receipt.sub_type || "",
      amount: receipt.amount.toString(),
      description: receipt.description || "",
      issue_date: receipt.issue_date,
      paid_date: receipt.paid_date || "",
      status: receipt.status,
      notes: receipt.notes || "",
    });
    setEditMode(true);
    setEditingReceiptId(receipt.id);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const statusColors = {
    paid: "bg-accent",
    pending: "bg-yellow-500",
    cancelled: "bg-destructive",
  };

  const statusLabels = {
    paid: "Pago",
    pending: "Pendente",
    cancelled: "Cancelado",
  };

  const filteredReceipts = allReceipts
    ?.filter((receipt) =>
      receipt.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.filter((receipt) => {
      if (typeFilter === "all") return true;
      if (typeFilter === "contabilidade") return receipt.type === "contabilidade";
      if (typeFilter === "seguros") return (receipt as any).is_insurance_receipt === true;
      return true;
    })
    ?.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "issue_date") {
        comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
      } else if (sortBy === "paid_date") {
        const aDate = a.paid_date ? new Date(a.paid_date).getTime() : 0;
        const bDate = b.paid_date ? new Date(b.paid_date).getTime() : 0;
        comparison = aDate - bDate;
      } else if (sortBy === "status") {
        const statusOrder = { paid: 0, pending: 1, cancelled: 2 };
        comparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recibos de Contabilidade</h1>
          <p className="text-muted-foreground">Gestão de recibos de contabilidade</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recibo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? "Editar Recibo" : "Novo Recibo de Contabilidade"}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    O número do recibo será gerado automaticamente
                  </p>
                </div>
                <div>
                  <Label htmlFor="customer">Cliente *</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sub_type">Sub-Tipo *</Label>
                  <Select value={formData.sub_type} onValueChange={(value) => setFormData({ ...formData, sub_type: value })}>
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
                  <Label htmlFor="description">Descrição do Serviço *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhe o serviço prestado..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issue_date">Data de Emissão *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="paid_date">Data de Pagamento</Label>
                  <Input
                    id="paid_date"
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      paid_date: e.target.value,
                      status: e.target.value ? "paid" : formData.status 
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se inserir data de pagamento, o recibo será marcado como pago
                  </p>
                </div>
                <div>
                  <Label htmlFor="status">Estado *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editMode ? "Atualizar Recibo" : "Criar Recibo"}
                </Button>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Recibos</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contabilidade">Contabilidade</SelectItem>
                  <SelectItem value="seguros">Seguros</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue_date">Data Emissão</SelectItem>
                  <SelectItem value="paid_date">Data Pagamento</SelectItem>
                  <SelectItem value="status">Estado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente</SelectItem>
                  <SelectItem value="desc">Descendente</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sub-Tipo/Descrição</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts?.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                  <TableCell>
                    <Badge variant={(receipt as any).is_insurance_receipt ? "secondary" : "default"}>
                      {receipt.type === "contabilidade" ? "Contabilidade" : "Seguros"}
                    </Badge>
                  </TableCell>
                  <TableCell>{receipt.customers?.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {receipt.type === "contabilidade" && (receipt as any).sub_type && (
                        <div className="font-medium">{(receipt as any).sub_type}</div>
                      )}
                      <div className="text-muted-foreground truncate max-w-xs">
                        {(receipt as any).description || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Emitido: {new Date(receipt.issue_date).toLocaleDateString("pt-PT")}</div>
                      {receipt.paid_date && (
                        <div className="text-muted-foreground">Pago: {new Date(receipt.paid_date).toLocaleDateString("pt-PT")}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>€{Number(receipt.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {(receipt as any).is_insurance_receipt ? (
                      <div className="flex gap-1 flex-wrap items-center">
                        {(receipt as any).insurance_receipt_data?.recebido_maiato ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">Pago</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">Pendente</Badge>
                        )}
                        {(receipt as any).insurance_receipt_data?.estorno && (
                          <Badge variant="destructive">Estorno</Badge>
                        )}
                        {(receipt as any).insurance_receipt_data?.pago_companhia && (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">Pag. comp</Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className={statusColors[receipt.status as keyof typeof statusColors]}>
                        {statusLabels[receipt.status as keyof typeof statusLabels]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setViewDetailsOpen(true);
                        }}
                      >
                        Ver Detalhes
                      </Button>
                      {!(receipt as any).is_insurance_receipt && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(receipt)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja apagar este recibo?")) {
                                deleteMutation.mutate(receipt.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                            Apagar
                          </Button>
                          <Dialog open={editingReceipt?.id === receipt.id} onOpenChange={(open) => !open && setEditingReceipt(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingReceipt(receipt)}
                              >
                                Estado
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Alterar Estado do Recibo</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Recibo: {receipt.receipt_number}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Cliente: {receipt.customers?.name}
                                  </p>
                                </div>
                                <div>
                                  <Label>Novo Estado</Label>
                                  <Select
                                    defaultValue={receipt.status}
                                    onValueChange={(value) => {
                                      updateMutation.mutate({ id: receipt.id, status: value });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pendente</SelectItem>
                                      <SelectItem value="paid">Pago</SelectItem>
                                      <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes Completos do {(selectedReceipt as any)?.is_insurance_receipt ? 'Recibo Seguro' : 'Recibo'}</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
              <div className="space-y-6">
                {/* Informação Principal */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">Informação Principal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Número Recibo</Label>
                      <p className="font-medium">{selectedReceipt.receipt_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tipo</Label>
                      <Badge variant={(selectedReceipt as any).is_insurance ? "secondary" : "default"}>
                        {selectedReceipt.type === "contabilidade" ? "Contabilidade" : "Seguros"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cliente</Label>
                      <p className="font-medium">{selectedReceipt.customers?.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estado</Label>
                      <Badge className={statusColors[selectedReceipt.status as keyof typeof statusColors]}>
                        {statusLabels[selectedReceipt.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Valores e Datas */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">Valores e Datas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Valor Total</Label>
                      <p className="text-2xl font-bold text-primary">€{Number(selectedReceipt.amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estado de Pagamento</Label>
                      <p className="font-medium">
                        {selectedReceipt.status === "paid" ? "✓ Pago" : 
                         selectedReceipt.status === "pending" ? "⏱ Pendente" : "✕ Cancelado"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Emissão</Label>
                      <p className="font-medium">{new Date(selectedReceipt.issue_date).toLocaleDateString("pt-PT", { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Pagamento</Label>
                      <p className="font-medium">
                        {selectedReceipt.paid_date 
                          ? new Date(selectedReceipt.paid_date).toLocaleDateString("pt-PT", { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric' 
                            })
                          : 'Não pago'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalhes do Serviço */}
                {!((selectedReceipt as any).is_insurance) && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 text-lg">Detalhes do Serviço</h3>
                    <div className="space-y-3">
                      {(selectedReceipt as any).sub_type && (
                        <div>
                          <Label className="text-muted-foreground">Sub-tipo</Label>
                          <p className="font-medium">{(selectedReceipt as any).sub_type}</p>
                        </div>
                      )}
                      {(selectedReceipt as any).description && (
                        <div>
                          <Label className="text-muted-foreground">Descrição do Serviço</Label>
                          <p className="whitespace-pre-wrap">{(selectedReceipt as any).description}</p>
                        </div>
                      )}
                      {(selectedReceipt as any).notes && (
                        <div>
                          <Label className="text-muted-foreground">Notas Adicionais</Label>
                          <p className="whitespace-pre-wrap text-muted-foreground italic">{(selectedReceipt as any).notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informação de Seguro */}
                {(selectedReceipt as any).is_insurance && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 text-lg">Informação do Seguro</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Companhia de Seguros</Label>
                        <p className="font-medium">{(selectedReceipt as any).description?.split(' - ')[0] || '-'}</p>
                      </div>
                      {(selectedReceipt as any).description && (
                        <div>
                          <Label className="text-muted-foreground">Descrição</Label>
                          <p className="whitespace-pre-wrap">{(selectedReceipt as any).description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informação do Sistema */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">Informação do Sistema</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Data de Criação</Label>
                      <p>{new Date(selectedReceipt.created_at).toLocaleString("pt-PT")}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Última Atualização</Label>
                      <p>{new Date(selectedReceipt.updated_at).toLocaleString("pt-PT")}</p>
                    </div>
                    {selectedReceipt.last_modified_date && (
                      <div>
                        <Label className="text-muted-foreground">Última Modificação</Label>
                        <p>{new Date(selectedReceipt.last_modified_date).toLocaleString("pt-PT")}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">ID do Recibo</Label>
                      <p className="font-mono text-xs">{selectedReceipt.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receipts;
