import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CustomerFamilyProps {
  customerId: string;
}

export const CustomerFamily = ({ customerId }: CustomerFamilyProps) => {
  const [open, setOpen] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState("");
  const [existingRelationship, setExistingRelationship] = useState("conjuge");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nif: "",
    address: "",
    notes: "",
    relationship: "conjuge",
  });

  const queryClient = useQueryClient();

  const { data: familyMembers } = useQuery({
    queryKey: ["family-members", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*, customer_ref:customers!customer_ref_id(name)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .neq("id", customerId) // Exclude current customer
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        console.log("Starting family member creation...", data);
        const { data: { user } } = await supabase.auth.getUser();
        console.log("User:", user?.id);
        
        // 1. Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([{
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            nif: data.nif || null,
            address: data.address || null,
            notes: data.notes || null,
            user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          }])
          .select()
          .single();
        
        if (customerError) {
          console.error("Customer creation error:", customerError);
          throw customerError;
        }
        console.log("New customer created:", newCustomer);

        // Get reciprocal relationship
        const getReciprocalRelationship = (relationship: string): string => {
          const reciprocal: Record<string, string> = {
            "avo": "neto",
            "neto": "avo",
            "pai": "filho",
            "filho": "pai",
            "conjuge": "conjuge",
            "outro": "outro",
          };
          return reciprocal[relationship] || "outro";
        };

        // 2. Create bidirectional family relationships
        const reciprocalRelationship = getReciprocalRelationship(data.relationship);
        console.log("Creating family relationships:", { relationship: data.relationship, reciprocal: reciprocalRelationship });
        
        const { error: familyError1 } = await supabase.from("family_members").insert([
          {
            customer_id: customerId,
            customer_ref_id: newCustomer.id,
            name: data.name,
            relationship: data.relationship,
          },
          {
            customer_id: newCustomer.id,
            customer_ref_id: customerId,
            name: data.name, // Store the name for reference
            relationship: reciprocalRelationship,
          }
        ]);
        
        if (familyError1) {
          console.error("Family relationship error:", familyError1);
          throw familyError1;
        }
        console.log("Family relationships created successfully");
      } catch (error) {
        console.error("Full error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Familiar criado como novo cliente com sucesso");
      setOpen(false);
      setFormData({ 
        name: "", 
        email: "",
        phone: "",
        nif: "",
        address: "",
        notes: "",
        relationship: "conjuge" 
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Erro ao criar familiar: " + (error as any).message);
    },
  });

  const linkExistingMutation = useMutation({
    mutationFn: async ({ customerId: existingId, relationship }: { customerId: string; relationship: string }) => {
      try {
        console.log("Linking existing customer...", { existingId, relationship });

        // Get reciprocal relationship
        const getReciprocalRelationship = (relationship: string): string => {
          const reciprocal: Record<string, string> = {
            "avo": "neto",
            "neto": "avo",
            "pai": "filho",
            "filho": "pai",
            "conjuge": "conjuge",
            "outro": "outro",
          };
          return reciprocal[relationship] || "outro";
        };

        const reciprocalRelationship = getReciprocalRelationship(relationship);
        console.log("Creating bidirectional relationships:", { relationship, reciprocal: reciprocalRelationship });
        
        // Get the customer name for reference
        const { data: customerData } = await supabase
          .from("customers")
          .select("name")
          .eq("id", existingId)
          .single();

        const { error: familyError } = await supabase.from("family_members").insert([
          {
            customer_id: customerId,
            customer_ref_id: existingId,
            name: customerData?.name || "",
            relationship: relationship,
          },
          {
            customer_id: existingId,
            customer_ref_id: customerId,
            name: customerData?.name || "",
            relationship: reciprocalRelationship,
          }
        ]);
        
        if (familyError) {
          console.error("Family relationship error:", familyError);
          throw familyError;
        }
        console.log("Family relationships created successfully");
      } catch (error) {
        console.error("Full error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", customerId] });
      toast.success("Cliente vinculado à família com sucesso");
      setOpen(false);
      setExistingCustomerId("");
      setExistingRelationship("conjuge");
    },
    onError: (error) => {
      console.error("Link mutation error:", error);
      toast.error("Erro ao vincular familiar: " + (error as any).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get the family member to find the reciprocal relationship
      const { data: member } = await supabase
        .from("family_members")
        .select("customer_ref_id")
        .eq("id", id)
        .single();
      
      // Delete both relationships
      const { error } = await supabase
        .from("family_members")
        .delete()
        .or(`id.eq.${id},and(customer_id.eq.${member?.customer_ref_id},customer_ref_id.eq.${customerId})`);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", customerId] });
      toast.success("Relação familiar removida");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleLinkExisting = (e: React.FormEvent) => {
    e.preventDefault();
    linkExistingMutation.mutate({ 
      customerId: existingCustomerId, 
      relationship: existingRelationship 
    });
  };

  const relationshipLabels = {
    avo: "Avô/Avó",
    pai: "Pai/Mãe",
    conjuge: "Cônjuge",
    filho: "Filho/Filha",
    neto: "Neto/Neta",
    outro: "Outro",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Familiares</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Familiar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Familiar</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">Criar Novo Cliente</TabsTrigger>
                <TabsTrigger value="existing">Cliente Existente</TabsTrigger>
              </TabsList>
              
              <TabsContent value="new">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Parentesco *</Label>
                    <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avo">Avô/Avó</SelectItem>
                        <SelectItem value="pai">Pai/Mãe</SelectItem>
                        <SelectItem value="conjuge">Cônjuge</SelectItem>
                        <SelectItem value="filho">Filho/Filha</SelectItem>
                        <SelectItem value="neto">Neto/Neta</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.pt"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nif">NIF</Label>
                      <Input
                        id="nif"
                        value={formData.nif}
                        onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Morada</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">Criar Cliente e Adicionar à Família</Button>
                </form>
              </TabsContent>

              <TabsContent value="existing">
                <form onSubmit={handleLinkExisting} className="space-y-4">
                  <div>
                    <Label htmlFor="existing-customer">Selecione o Cliente *</Label>
                    <Select value={existingCustomerId} onValueChange={setExistingCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCustomers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="existing-relationship">Parentesco *</Label>
                    <Select value={existingRelationship} onValueChange={setExistingRelationship}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avo">Avô/Avó</SelectItem>
                        <SelectItem value="pai">Pai/Mãe</SelectItem>
                        <SelectItem value="conjuge">Cônjuge</SelectItem>
                        <SelectItem value="filho">Filho/Filha</SelectItem>
                        <SelectItem value="neto">Neto/Neta</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={!existingCustomerId}>
                    Adicionar Cliente à Família
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {familyMembers?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum familiar registado</p>
          )}
          {familyMembers?.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{member.customer_ref?.name || member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {relationshipLabels[member.relationship as keyof typeof relationshipLabels]}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(member.id)}
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
