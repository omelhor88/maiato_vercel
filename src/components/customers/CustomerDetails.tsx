import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit } from "lucide-react";
import { CustomerReceipts } from "./CustomerReceipts";
import { CustomerFamily } from "./CustomerFamily";
import { CustomerReminders } from "./CustomerReminders";
import { CustomerPrintOptions } from "./CustomerPrintOptions";
import { CustomerHistory } from "./CustomerHistory";
import { CustomerForm } from "./CustomerForm";
import { CustomerSummary } from "./CustomerSummary";
import { CustomerInsurancePolicies } from "./CustomerInsurancePolicies";

interface CustomerDetailsProps {
  customer: any;
  onBack: () => void;
  onUpdate: () => void;
}

export const CustomerDetails = ({ customer, onBack, onUpdate }: CustomerDetailsProps) => {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">Detalhes do cliente</p>
        </div>
        <Button onClick={() => setEditOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
            {customer.phone && <p><strong>Telefone:</strong> {customer.phone}</p>}
            {customer.nif && <p><strong>NIF:</strong> {customer.nif}</p>}
            {customer.address && <p><strong>Morada:</strong> {customer.address}</p>}
            {customer.internet && <p><strong>Password Portal das Finanças:</strong> {customer.internet}</p>}
            {customer.niss && <p><strong>NISS:</strong> {customer.niss}</p>}
            {customer.social_security_code && <p><strong>Código de Segurança NISS:</strong> {customer.social_security_code}</p>}
            {customer.mobile_key && <p><strong>Chave Móvel Digital:</strong> {customer.mobile_key}</p>}
            {customer.notes && <p><strong>Notas:</strong> {customer.notes}</p>}
          </CardContent>
        </Card>

        <CustomerSummary customerId={customer.id} />
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="receipts">Recibos</TabsTrigger>
          <TabsTrigger value="insurance">Seguros</TabsTrigger>
          <TabsTrigger value="family">Familiares</TabsTrigger>
          <TabsTrigger value="reminders">Lembretes</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="print">Imprimir</TabsTrigger>
        </TabsList>
        <TabsContent value="receipts">
          <CustomerReceipts customerId={customer.id} customerName={customer.name} />
        </TabsContent>
        <TabsContent value="insurance">
          <CustomerInsurancePolicies customerId={customer.id} customerName={customer.name} />
        </TabsContent>
        <TabsContent value="family">
          <CustomerFamily customerId={customer.id} />
        </TabsContent>
        <TabsContent value="reminders">
          <CustomerReminders customerId={customer.id} customerName={customer.name} />
        </TabsContent>
        <TabsContent value="history">
          <CustomerHistory customerId={customer.id} customerNif={customer.nif} />
        </TabsContent>
        <TabsContent value="print">
          <CustomerPrintOptions customer={customer} />
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={customer}
            onSuccess={() => {
              setEditOpen(false);
              onUpdate();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
