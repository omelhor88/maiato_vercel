import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CustomerListProps {
  customers: any[];
  onView: (customer: any) => void;
  onEdit: (customer: any) => void;
  onDelete: (id: string) => void;
}

export const CustomerList = ({ customers, onView, onEdit, onDelete }: CustomerListProps) => {
  const { data: titles } = useQuery({
    queryKey: ["titles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("titles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const getTitleName = (titleCode: string) => {
    const title = titles?.find((t) => t.id.toString() === titleCode);
    return title?.name || "";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {customers?.map((customer) => (
        <Card key={customer.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <span>
                {customer.title_code && getTitleName(customer.title_code) && (
                  <>{getTitleName(customer.title_code)} </>
                )}
                {customer.name}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onView(customer)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(customer.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.email && <p>📧 {customer.email}</p>}
            {customer.phone && <p>📱 {customer.phone}</p>}
            {customer.nif && <p>🆔 NIF: {customer.nif}</p>}
            {customer.address && <p className="text-muted-foreground">📍 {customer.address}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
