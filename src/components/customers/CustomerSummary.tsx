import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, FileText, Bell, Users } from "lucide-react";

interface CustomerSummaryProps {
  customerId: string;
}

export const CustomerSummary = ({ customerId }: CustomerSummaryProps) => {
  const { data: receiptsData } = useQuery({
    queryKey: ["customer-receipts-summary", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("amount, status")
        .eq("customer_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: insuranceData } = useQuery({
    queryKey: ["customer-insurance-summary", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance")
        .select("numero")
        .eq("customer_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: remindersData } = useQuery({
    queryKey: ["customer-reminders-summary", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("id, completed")
        .eq("customer_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: familyData } = useQuery({
    queryKey: ["customer-family-summary", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("id")
        .eq("customer_id", customerId);
      if (error) throw error;
      return data;
    },
  });

  const totalReceipts = receiptsData?.length || 0;
  const paidReceipts = receiptsData?.filter(r => r.status === "paid").length || 0;
  const pendingReceipts = receiptsData?.filter(r => r.status === "pending").length || 0;
  const totalReceiptsValue = receiptsData?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;
  
  const totalInsurance = insuranceData?.length || 0;
  
  const totalReminders = remindersData?.length || 0;
  const pendingReminders = remindersData?.filter(r => !r.completed).length || 0;
  
  const totalFamily = familyData?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-md bg-primary/10">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Recibos Contabilidade</p>
            <p className="text-xs text-muted-foreground">
              {totalReceipts} total • {paidReceipts} pagos • {pendingReceipts} pendentes
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{totalReceiptsValue.toFixed(2)}€</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-md bg-blue-500/10">
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Seguros</p>
            <p className="text-xs text-muted-foreground">
              {totalInsurance} {totalInsurance === 1 ? "apólice" : "apólices"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-md bg-amber-500/10">
            <Bell className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Lembretes</p>
            <p className="text-xs text-muted-foreground">
              {totalReminders} total • {pendingReminders} pendentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-md bg-green-500/10">
            <Users className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Familiares</p>
            <p className="text-xs text-muted-foreground">
              {totalFamily} {totalFamily === 1 ? "membro" : "membros"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
