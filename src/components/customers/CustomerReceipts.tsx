import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerReceiptsNew } from "./CustomerReceiptsNew";
import { CustomerInsuranceReceipts } from "./CustomerInsuranceReceipts";

interface CustomerReceiptsProps {
  customerId: string;
  customerName: string;
}

export const CustomerReceipts = ({ customerId, customerName }: CustomerReceiptsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recibos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="contabilidade" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contabilidade">Recibos Contabilidade</TabsTrigger>
            <TabsTrigger value="seguros">Recibos Seguros</TabsTrigger>
          </TabsList>
          <TabsContent value="contabilidade" className="mt-4">
            <CustomerReceiptsNew customerId={customerId} />
          </TabsContent>
          <TabsContent value="seguros" className="mt-4">
            <CustomerInsuranceReceipts customerId={customerId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
