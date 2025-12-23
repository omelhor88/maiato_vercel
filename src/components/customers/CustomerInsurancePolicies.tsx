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
import { Plus, Edit, Eye, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InsuranceReceiptForm } from "./InsuranceReceiptForm";


interface CustomerInsurancePoliciesProps {
  customerId: string;
  customerName?: string;
}

export const CustomerInsurancePolicies = ({ customerId, customerName }: CustomerInsurancePoliciesProps) => {
  const queryClient = useQueryClient();
  
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [viewInsuranceOpen, setViewInsuranceOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedInsuranceForReceipt, setSelectedInsuranceForReceipt] = useState<any>(null);

  const [insuranceFormData, setInsuranceFormData] = useState({
    customer_id: customerId,
    nif: "",
    codigo_mediador: "",
    numero_apolice: "",
    numero_produto: "",
    numero_angariador: "",
    numero_mes: "",
    data_vencimento: "",
    matricula: "",
    subanga_codigo: "",
    codigo_marca: "",
    codigo_estado: "",
    data_emissao_seg: format(new Date(), 'yyyy-MM-dd'),
    data_cancelamento: "",
    codigo_pagamento: "",
    insurance_company_codigo: "",
  });

  // Fetch customer NIF first
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


  const { data: insurance } = useQuery({
    queryKey: ["customer-insurance-policies", customerId, customerNifNormalized],
    enabled: customerNifCandidates.length > 0,
    queryFn: async () => {
      let insuranceQuery = supabase
        .from("insurance")
        .select("*, insurance_companies(nome)");

      insuranceQuery =
        customerNifCandidates.length === 1
          ? insuranceQuery.eq("nif", customerNifCandidates[0])
          : insuranceQuery.in("nif", customerNifCandidates);

      const { data, error } = await insuranceQuery.order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch receipt count for each insurance
      const insuranceWithReceiptCount = await Promise.all(
        (data || []).map(async (ins) => {
          if (!ins.numero_apolice) return { ...ins, receiptCount: 0 };
          const { count } = await supabase
            .from("insurance_receipts")
            .select("*", { count: "exact", head: true })
            .eq("apolice_numero", ins.numero_apolice);
          return { ...ins, receiptCount: count || 0 };
        })
      );

      return insuranceWithReceiptCount;
    },
  });


  // Fetch reference data
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, name, nif").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    setInsuranceFormData({ 
      ...insuranceFormData, 
      customer_id: customerId,
      nif: customer?.nif || ""
    });
  };

  const { data: mediators } = useQuery({
    queryKey: ["insurance_mediators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_mediators").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["insurance_products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_products").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: angariadores } = useQuery({
    queryKey: ["angariadores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("angariadores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: months } = useQuery({
    queryKey: ["insurance_months"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_months").select("*").order("numero");
      if (error) throw error;
      return data;
    },
  });

  const { data: subangariadores } = useQuery({
    queryKey: ["subangariadores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subangariadores").select("*").order("subanga_nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["vehicle_brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_brands").select("*").order("marca");
      if (error) throw error;
      return data;
    },
  });

  const { data: states } = useQuery({
    queryKey: ["insurance_states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_states").select("*").order("estado");
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentTypes } = useQuery({
    queryKey: ["payment_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_types").select("*").order("tipo_pagamento");
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

  const createInsuranceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!data.customer_id) {
        throw new Error("Cliente é obrigatório");
      }
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar NIF do cliente automaticamente
      const { data: customerData } = await supabase
        .from("customers")
        .select("nif")
        .eq("id", data.customer_id)
        .maybeSingle();
      
      const insertData: any = {
        customer_id: data.customer_id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        nif: customerData?.nif || null, // Sempre preenche com o NIF do cliente
      };
      
      if (data.codigo_mediador && data.codigo_mediador !== "NONE") insertData.codigo_mediador = data.codigo_mediador;
      if (data.numero_apolice) insertData.numero_apolice = data.numero_apolice;
      if (data.numero_produto && data.numero_produto !== "NONE") insertData.numero_produto = data.numero_produto;
      if (data.numero_angariador && data.numero_angariador !== "NONE") insertData.numero_angariador = data.numero_angariador;
      if (data.numero_mes) insertData.numero_mes = parseInt(data.numero_mes);
      if (data.data_vencimento) insertData.data_vencimento = data.data_vencimento;
      if (data.matricula) insertData.matricula = data.matricula;
      if (data.subanga_codigo && data.subanga_codigo !== "NONE") insertData.subanga_codigo = data.subanga_codigo;
      if (data.codigo_marca && data.codigo_marca !== "NONE") insertData.codigo_marca = data.codigo_marca;
      if (data.codigo_estado) insertData.codigo_estado = data.codigo_estado;
      if (data.data_emissao_seg) insertData.data_emissao_seg = data.data_emissao_seg;
      if (data.data_cancelamento) insertData.data_cancelamento = data.data_cancelamento;
      if (data.codigo_pagamento) insertData.codigo_pagamento = data.codigo_pagamento;
      if (data.insurance_company_codigo) insertData.insurance_company_codigo = data.insurance_company_codigo;
      
      const { error } = await supabase.from("insurance").insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-insurance-policies", customerId] });
      toast.success("Seguro criado com sucesso");
      resetInsuranceForm();
    },
  });

  const updateInsuranceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updateData: any = {};
      
      if (data.customer_id) updateData.customer_id = data.customer_id;
      if (data.nif) updateData.nif = data.nif;
      if (data.codigo_mediador !== undefined) updateData.codigo_mediador = data.codigo_mediador === "NONE" ? null : data.codigo_mediador;
      if (data.numero_apolice) updateData.numero_apolice = data.numero_apolice;
      if (data.numero_produto !== undefined) updateData.numero_produto = data.numero_produto === "NONE" ? null : data.numero_produto;
      if (data.numero_angariador !== undefined) updateData.numero_angariador = data.numero_angariador === "NONE" ? null : data.numero_angariador;
      if (data.numero_mes) updateData.numero_mes = parseInt(data.numero_mes);
      if (data.data_vencimento) updateData.data_vencimento = data.data_vencimento;
      if (data.matricula) updateData.matricula = data.matricula;
      if (data.subanga_codigo !== undefined) updateData.subanga_codigo = data.subanga_codigo === "NONE" ? null : data.subanga_codigo;
      if (data.codigo_marca !== undefined) updateData.codigo_marca = data.codigo_marca === "NONE" ? null : data.codigo_marca;
      if (data.codigo_estado) updateData.codigo_estado = data.codigo_estado;
      if (data.data_emissao_seg) updateData.data_emissao_seg = data.data_emissao_seg;
      if (data.data_cancelamento) updateData.data_cancelamento = data.data_cancelamento;
      if (data.codigo_pagamento) updateData.codigo_pagamento = data.codigo_pagamento;
      if (data.insurance_company_codigo) updateData.insurance_company_codigo = data.insurance_company_codigo;
      
      const { error } = await supabase
        .from("insurance")
        .update(updateData)
        .eq("numero", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-insurance-policies", customerId] });
      toast.success("Seguro atualizado");
      resetInsuranceForm();
    },
  });

  const resetInsuranceForm = () => {
    setInsuranceFormData({
      customer_id: customerId,
      nif: "",
      codigo_mediador: "",
      numero_apolice: "",
      numero_produto: "",
      numero_angariador: "",
      numero_mes: "",
      data_vencimento: "",
      matricula: "",
      subanga_codigo: "",
      codigo_marca: "",
      codigo_estado: "",
      data_emissao_seg: format(new Date(), 'yyyy-MM-dd'),
      data_cancelamento: "",
      codigo_pagamento: "",
      insurance_company_codigo: "",
    });
    setEditingInsuranceId(null);
    setInsuranceOpen(false);
  };

  const handleInsuranceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingInsuranceId) {
      updateInsuranceMutation.mutate({ id: editingInsuranceId, data: insuranceFormData });
    } else {
      createInsuranceMutation.mutate(insuranceFormData);
    }
  };

  const handleEditInsurance = (ins: any) => {
    setEditingInsuranceId(ins.numero);
    setInsuranceFormData({
      customer_id: ins.customer_id || customerId,
      nif: ins.nif || "",
      codigo_mediador: ins.codigo_mediador || "NONE",
      numero_apolice: ins.numero_apolice || "",
      numero_produto: ins.numero_produto || "NONE",
      numero_angariador: ins.numero_angariador || "NONE",
      numero_mes: ins.numero_mes?.toString() || "",
      data_vencimento: ins.data_vencimento || "",
      matricula: ins.matricula || "",
      subanga_codigo: ins.subanga_codigo || "NONE",
      codigo_marca: ins.codigo_marca || "NONE",
      codigo_estado: ins.codigo_estado || "",
      data_emissao_seg: ins.data_emissao_seg || format(new Date(), 'yyyy-MM-dd'),
      data_cancelamento: ins.data_cancelamento || "",
      codigo_pagamento: ins.codigo_pagamento || "",
      insurance_company_codigo: ins.insurance_company_codigo || "",
    });
    setInsuranceOpen(true);
  };

  const handleAddReceipt = (ins: any) => {
    setSelectedInsuranceForReceipt(ins);
    setReceiptDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={insuranceOpen} onOpenChange={setInsuranceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { resetInsuranceForm(); setInsuranceOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Seguro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{editingInsuranceId ? "Editar Seguro" : "Novo Seguro"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
                  <form onSubmit={handleInsuranceSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Cliente */}
                      <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <Select value={insuranceFormData.customer_id} onValueChange={handleCustomerChange}>
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

                      {/* Número Apólice */}
                      <div className="space-y-2">
                        <Label>Número Apólice</Label>
                        <Input
                          value={insuranceFormData.numero_apolice}
                          onChange={(e) => setInsuranceFormData({ ...insuranceFormData, numero_apolice: e.target.value })}
                        />
                      </div>

                      {/* Seguradora */}
                      <div className="space-y-2">
                        <Label>Seguradora</Label>
                        <Select value={insuranceFormData.insurance_company_codigo} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, insurance_company_codigo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seguradora" />
                          </SelectTrigger>
                          <SelectContent>
                            {insuranceCompanies?.map((c) => (
                              <SelectItem key={c.codigo} value={c.codigo}>{c.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mediador */}
                      <div className="space-y-2">
                        <Label>Mediador</Label>
                        <Select value={insuranceFormData.codigo_mediador} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, codigo_mediador: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione mediador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem mediador</SelectItem>
                            {mediators?.map((m) => (
                              <SelectItem key={m.bi} value={m.bi}>{m.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Produto */}
                      <div className="space-y-2">
                        <Label>Produto</Label>
                        <Select value={insuranceFormData.numero_produto} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, numero_produto: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione produto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem produto</SelectItem>
                            {products?.map((p) => (
                              <SelectItem key={p.numero_produto} value={p.numero_produto}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Angariador */}
                      <div className="space-y-2">
                        <Label>Angariador</Label>
                        <Select value={insuranceFormData.numero_angariador} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, numero_angariador: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione angariador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem angariador</SelectItem>
                            {angariadores?.map((a) => (
                              <SelectItem key={a.numero_angariador} value={a.numero_angariador}>{a.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mês */}
                      <div className="space-y-2">
                        <Label>Mês</Label>
                        <Select value={insuranceFormData.numero_mes} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, numero_mes: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {months?.map((m) => (
                              <SelectItem key={m.numero} value={m.numero.toString()}>{m.mes}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Data Vencimento */}
                      <div className="space-y-2">
                        <Label>Data Vencimento</Label>
                        <Input
                          type="date"
                          value={insuranceFormData.data_vencimento}
                          onChange={(e) => setInsuranceFormData({ ...insuranceFormData, data_vencimento: e.target.value })}
                        />
                      </div>

                      {/* Matrícula */}
                      <div className="space-y-2">
                        <Label>Matrícula</Label>
                        <Input
                          value={insuranceFormData.matricula}
                          onChange={(e) => setInsuranceFormData({ ...insuranceFormData, matricula: e.target.value })}
                          placeholder="Matrícula do veículo"
                        />
                      </div>

                      {/* Sub-angariador */}
                      <div className="space-y-2">
                        <Label>Sub-angariador</Label>
                        <Select value={insuranceFormData.subanga_codigo} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, subanga_codigo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sub-angariador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem sub-angariador</SelectItem>
                            {subangariadores?.map((s) => (
                              <SelectItem key={s.subanga_codigo} value={s.subanga_codigo}>{s.subanga_nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Marca */}
                      <div className="space-y-2">
                        <Label>Marca</Label>
                        <Select value={insuranceFormData.codigo_marca} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, codigo_marca: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione marca" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem marca</SelectItem>
                            {brands?.map((b) => (
                              <SelectItem key={b.codigo_marca} value={b.codigo_marca}>{b.marca}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select value={insuranceFormData.codigo_estado} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, codigo_estado: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {states?.map((s) => (
                              <SelectItem key={s.codigo_estado} value={s.codigo_estado}>{s.estado}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Data Emissão */}
                      <div className="space-y-2">
                        <Label>Data Emissão</Label>
                        <Input
                          type="date"
                          value={insuranceFormData.data_emissao_seg}
                          onChange={(e) => setInsuranceFormData({ ...insuranceFormData, data_emissao_seg: e.target.value })}
                        />
                      </div>

                      {/* Data Cancelamento - só aparece se estado for CANCELADO ou SUSPENSO */}
                      {(insuranceFormData.codigo_estado === "CANCELADO" || insuranceFormData.codigo_estado === "SUSPENSO") && (
                        <div className="space-y-2">
                          <Label>Data Cancelamento</Label>
                          <Input
                            type="date"
                            value={insuranceFormData.data_cancelamento}
                            onChange={(e) => setInsuranceFormData({ ...insuranceFormData, data_cancelamento: e.target.value })}
                          />
                        </div>
                      )}

                      {/* Tipo Pagamento */}
                      <div className="space-y-2">
                        <Label>Tipo Pagamento</Label>
                        <Select value={insuranceFormData.codigo_pagamento} onValueChange={(value) => setInsuranceFormData({ ...insuranceFormData, codigo_pagamento: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione tipo pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentTypes?.map((p) => (
                              <SelectItem key={p.codigo_pagamento} value={p.codigo_pagamento}>{p.tipo_pagamento}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setInsuranceOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar Seguro</Button>
                    </div>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apólice</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead>Recibos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insurance?.map((ins) => (
                <TableRow key={ins.numero}>
                  <TableCell>{ins.numero_apolice || "-"}</TableCell>
                  <TableCell>{ins.insurance_companies?.nome || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={ins.codigo_estado === "ACT" ? "default" : "secondary"}>
                      {ins.codigo_estado || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{ins.data_emissao_seg ? new Date(ins.data_emissao_seg).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ins.receiptCount || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInsurance(ins);
                          setViewInsuranceOpen(true);
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInsurance(ins)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddReceipt(ins)}
                        title="Adicionar recibo"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* View Insurance Dialog */}
        <Dialog open={viewInsuranceOpen} onOpenChange={setViewInsuranceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Seguro</DialogTitle>
            </DialogHeader>
            {selectedInsurance && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Apólice</Label>
                    <p className="text-sm">{selectedInsurance.numero_apolice || "-"}</p>
                  </div>
                  <div>
                    <Label>Seguradora</Label>
                    <p className="text-sm">{selectedInsurance.insurance_companies?.nome || "-"}</p>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <p className="text-sm">{selectedInsurance.codigo_estado || "-"}</p>
                  </div>
                  <div>
                    <Label>Data Emissão</Label>
                    <p className="text-sm">{selectedInsurance.data_emissao_seg ? new Date(selectedInsurance.data_emissao_seg).toLocaleDateString() : "-"}</p>
                  </div>
                  {selectedInsurance.data_vencimento && (
                    <div>
                      <Label>Data Vencimento</Label>
                      <p className="text-sm">{new Date(selectedInsurance.data_vencimento).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedInsurance.matricula && (
                    <div>
                      <Label>Matrícula</Label>
                      <p className="text-sm">{selectedInsurance.matricula}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Receipt Dialog */}
        <InsuranceReceiptForm
          open={receiptDialogOpen}
          onOpenChange={setReceiptDialogOpen}
          insurance={selectedInsuranceForReceipt}
          customerId={customerId}
          onSuccess={() => {
            setReceiptDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["customer-insurance-policies", customerId] });
          }}
        />
      </CardContent>
    </Card>
  );
};
