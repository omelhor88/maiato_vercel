import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserRole } from "@/hooks/useUserRole";

type EntityType = "mediator" | "angariador" | "subangariador" | "company" | "product" | "brand";

const ReferenceData = () => {
  const queryClient = useQueryClient();
  const { data: currentUserRole } = useUserRole();
  const [activeTab, setActiveTab] = useState<EntityType>("company");
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    codigo_mediador: "",
    logotipo: "",
    morada: "",
    subanga_nome: "",
    subanga_morada: "",
    marca: "",
    codigo_marca: "",
  });

  // Fetch all reference data
  const { data: mediators } = useQuery({
    queryKey: ["insurance_mediators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_mediators").select("*").order("nome");
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

  const { data: subangariadores } = useQuery({
    queryKey: ["subangariadores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subangariadores").select("*").order("subanga_nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["insurance_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_companies").select("*").order("nome");
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

  const { data: brands } = useQuery({
    queryKey: ["vehicle_brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_brands").select("*").order("marca");
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutations for each entity type
  const saveMutation = useMutation({
    mutationFn: async ({ type, id }: { type: EntityType; id?: string }) => {
      if (editMode && id) {
        // Update existing
        switch (type) {
          case "mediator": {
            const { error } = await supabase.from("insurance_mediators")
              .update({ nome: formData.nome })
              .eq("bi", id);
            if (error) throw error;
            break;
          }
          case "angariador": {
            const { error } = await supabase.from("angariadores")
              .update({ nome: formData.nome, morada: formData.morada || null })
              .eq("numero_angariador", id);
            if (error) throw error;
            break;
          }
          case "subangariador": {
            const { error } = await supabase.from("subangariadores")
              .update({ subanga_nome: formData.subanga_nome, subanga_morada: formData.subanga_morada || null })
              .eq("subanga_codigo", id);
            if (error) throw error;
            break;
          }
          case "company": {
            const { error } = await supabase.from("insurance_companies")
              .update({ 
                nome: formData.nome, 
                codigo_mediador: formData.codigo_mediador || null,
                logotipo: formData.logotipo || null 
              })
              .eq("codigo", id);
            if (error) throw error;
            break;
          }
          case "product": {
            const { error } = await supabase.from("insurance_products")
              .update({ nome: formData.nome })
              .eq("numero_produto", id);
            if (error) throw error;
            break;
          }
          case "brand": {
            const { error } = await supabase.from("vehicle_brands")
              .update({ marca: formData.marca })
              .eq("codigo_marca", id);
            if (error) throw error;
            break;
          }
        }
      } else {
        // Create new
        switch (type) {
          case "mediator": {
            const { error } = await supabase.from("insurance_mediators").insert({
              nome: formData.nome,
            });
            if (error) throw error;
            break;
          }
          case "angariador": {
            const { error } = await supabase.from("angariadores").insert({
              nome: formData.nome,
              morada: formData.morada || null,
            });
            if (error) throw error;
            break;
          }
          case "subangariador": {
            const { error } = await supabase.from("subangariadores").insert({
              subanga_nome: formData.subanga_nome,
              subanga_morada: formData.subanga_morada || null,
            });
            if (error) throw error;
            break;
          }
          case "company": {
            const { error } = await supabase.from("insurance_companies").insert({
              nome: formData.nome,
              codigo_mediador: formData.codigo_mediador || null,
              logotipo: formData.logotipo || null,
            });
            if (error) throw error;
            break;
          }
          case "product": {
            const { error } = await supabase.from("insurance_products").insert({
              nome: formData.nome,
            });
            if (error) throw error;
            break;
          }
          case "brand": {
            const { error } = await supabase.from("vehicle_brands").insert({
              codigo_marca: formData.codigo_marca,
              marca: formData.marca,
            });
            if (error) throw error;
            break;
          }
        }
      }
    },
    onSuccess: (_, { type }) => {
      const queryKey = type === "mediator" ? "insurance_mediators" 
        : type === "angariador" ? "angariadores"
        : type === "subangariador" ? "subangariadores"
        : type === "company" ? "insurance_companies"
        : type === "brand" ? "vehicle_brands"
        : "insurance_products";
      
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(editMode ? "Atualizado com sucesso" : "Criado com sucesso");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || (editMode ? "Erro ao atualizar" : "Erro ao criar"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: EntityType; id: string }) => {
      switch (type) {
        case "mediator": {
          const { error } = await supabase.from("insurance_mediators").delete().eq("bi", id);
          if (error) throw error;
          break;
        }
        case "angariador": {
          const { error } = await supabase.from("angariadores").delete().eq("numero_angariador", id);
          if (error) throw error;
          break;
        }
        case "subangariador": {
          const { error } = await supabase.from("subangariadores").delete().eq("subanga_codigo", id);
          if (error) throw error;
          break;
        }
        case "company": {
          const { error } = await supabase.from("insurance_companies").delete().eq("codigo", id);
          if (error) throw error;
          break;
        }
        case "product": {
          const { error } = await supabase.from("insurance_products").delete().eq("numero_produto", id);
          if (error) throw error;
          break;
        }
        case "brand": {
          const { error } = await supabase.from("vehicle_brands").delete().eq("codigo_marca", id);
          if (error) throw error;
          break;
        }
      }
    },
    onSuccess: (_, { type }) => {
      const queryKey = type === "mediator" ? "insurance_mediators" 
        : type === "angariador" ? "angariadores"
        : type === "subangariador" ? "subangariadores"
        : type === "company" ? "insurance_companies"
        : type === "brand" ? "vehicle_brands"
        : "insurance_products";
      
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Eliminado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao eliminar");
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo_mediador: "",
      logotipo: "",
      morada: "",
      subanga_nome: "",
      subanga_morada: "",
      marca: "",
      codigo_marca: "",
    });
    setEditMode(false);
    setEditingId(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ type: activeTab, id: editingId || undefined });
  };

  const handleEdit = (type: EntityType, item: any) => {
    setEditMode(true);
    setActiveTab(type);
    
    switch (type) {
      case "mediator":
        setEditingId(item.bi);
        setFormData({ ...formData, nome: item.nome });
        break;
      case "angariador":
        setEditingId(item.numero_angariador);
        setFormData({ ...formData, nome: item.nome, morada: item.morada || "" });
        break;
      case "subangariador":
        setEditingId(item.subanga_codigo);
        setFormData({ ...formData, subanga_nome: item.subanga_nome, subanga_morada: item.subanga_morada || "" });
        break;
      case "company":
        setEditingId(item.codigo);
        setFormData({ 
          ...formData, 
          nome: item.nome, 
          codigo_mediador: item.codigo_mediador || "",
          logotipo: item.logotipo || ""
        });
        break;
      case "product":
        setEditingId(item.numero_produto);
        setFormData({ ...formData, nome: item.nome });
        break;
      case "brand":
        setEditingId(item.codigo_marca);
        setFormData({ ...formData, marca: item.marca, codigo_marca: item.codigo_marca });
        break;
    }
    
    setOpen(true);
  };

  const handleDelete = (type: EntityType, id: string) => {
    if (confirm("Tem a certeza que deseja eliminar este registo?")) {
      deleteMutation.mutate({ type, id });
    }
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground mt-2">Apenas administradores podem aceder a esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dados de Referência</h1>
          <p className="text-muted-foreground">Gestão de seguradoras, mediadores, angariadores e produtos</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditMode(false); setEditingId(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Editar" : "Criar"} {activeTab === "mediator" && "Mediador"}
                {activeTab === "angariador" && "Angariador"}
                {activeTab === "subangariador" && "Sub-angariador"}
                {activeTab === "company" && "Seguradora"}
                {activeTab === "product" && "Produto"}
                {activeTab === "brand" && "Marca de Carro"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "company" && (
                <>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mediador</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.codigo_mediador}
                      onChange={(e) => setFormData({ ...formData, codigo_mediador: e.target.value })}
                    >
                      <option value="">Nenhum</option>
                      {mediators?.map((m) => (
                        <option key={m.bi} value={m.bi}>
                          {m.nome} ({m.bi})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Logotipo (URL)</Label>
                    <Input
                      value={formData.logotipo}
                      onChange={(e) => setFormData({ ...formData, logotipo: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {activeTab === "mediator" && (
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
              )}

              {activeTab === "angariador" && (
                <>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Morada</Label>
                    <Input
                      value={formData.morada}
                      onChange={(e) => setFormData({ ...formData, morada: e.target.value })}
                    />
                  </div>
                </>
              )}

              {activeTab === "subangariador" && (
                <>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.subanga_nome}
                      onChange={(e) => setFormData({ ...formData, subanga_nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Morada</Label>
                    <Input
                      value={formData.subanga_morada}
                      onChange={(e) => setFormData({ ...formData, subanga_morada: e.target.value })}
                    />
                  </div>
                </>
              )}


              {activeTab === "product" && (
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
              )}

              {activeTab === "brand" && (
                <>
                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input
                      value={formData.codigo_marca}
                      onChange={(e) => setFormData({ ...formData, codigo_marca: e.target.value.toUpperCase() })}
                      required
                      maxLength={10}
                      disabled={editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Marca *</Label>
                    <Input
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editMode ? "Atualizar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="company">Seguradoras</TabsTrigger>
          <TabsTrigger value="product">Produtos</TabsTrigger>
          <TabsTrigger value="brand">Marcas</TabsTrigger>
          <TabsTrigger value="mediator">Mediadores</TabsTrigger>
          <TabsTrigger value="angariador">Angariadores</TabsTrigger>
          <TabsTrigger value="subangariador">Sub-angariadores</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Seguradoras</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Mediador</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                  {companies?.map((company) => {
                    const mediator = mediators?.find((m) => m.bi === company.codigo_mediador);
                    return (
                      <TableRow key={company.codigo}>
                        <TableCell>{company.codigo}</TableCell>
                        <TableCell>{company.nome}</TableCell>
                        <TableCell>{mediator ? `${mediator.nome} (${mediator.bi})` : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit("company", company)}>
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete("company", company.codigo)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle>Produtos de Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.numero_produto}>
                      <TableCell>{product.numero_produto}</TableCell>
                      <TableCell>{product.nome}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("product", product)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("product", product.numero_produto)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle>Marcas de Carros</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands?.map((brand) => (
                    <TableRow key={brand.codigo_marca}>
                      <TableCell>{brand.codigo_marca}</TableCell>
                      <TableCell>{brand.marca}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("brand", brand)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("brand", brand.codigo_marca)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mediator">
          <Card>
            <CardHeader>
              <CardTitle>Mediadores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BI</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {mediators?.map((mediator) => (
                    <TableRow key={mediator.bi}>
                      <TableCell>{mediator.bi}</TableCell>
                      <TableCell>{mediator.nome}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("mediator", mediator)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("mediator", mediator.bi)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="angariador">
          <Card>
            <CardHeader>
              <CardTitle>Angariadores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Morada</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {angariadores?.map((ang) => (
                    <TableRow key={ang.numero_angariador}>
                      <TableCell>{ang.numero_angariador}</TableCell>
                      <TableCell>{ang.nome}</TableCell>
                      <TableCell>{ang.morada}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("angariador", ang)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("angariador", ang.numero_angariador)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subangariador">
          <Card>
            <CardHeader>
              <CardTitle>Sub-angariadores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Morada</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subangariadores?.map((sub) => (
                    <TableRow key={sub.subanga_codigo}>
                      <TableCell>{sub.subanga_codigo}</TableCell>
                      <TableCell>{sub.subanga_nome}</TableCell>
                      <TableCell>{sub.subanga_morada}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("subangariador", sub)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("subangariador", sub.subanga_codigo)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferenceData;
