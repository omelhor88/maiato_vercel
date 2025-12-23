import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { CustomerDetails } from "@/components/customers/CustomerDetails";
import { CustomerList } from "@/components/customers/CustomerList";
import { CustomerForm } from "@/components/customers/CustomerForm";

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.nif?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente eliminado com sucesso");
    },
  });

  const handleView = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem a certeza que deseja eliminar este cliente?")) {
      deleteMutation.mutate(id);
    }
  };

  if (selectedCustomer) {
    return (
      <CustomerDetails
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ["customers"] });
          setSelectedCustomer(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestão de clientes e histórico completo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCustomer(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => {
                setOpen(false);
                setEditingCustomer(null);
                queryClient.invalidateQueries({ queryKey: ["customers"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, NIF ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <CustomerList
        customers={filteredCustomers || []}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Customers;
