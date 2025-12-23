import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";

interface InsuranceReceiptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurance: any;
  customerId: string;
  onSuccess: () => void;
}

export const InsuranceReceiptForm = ({ 
  open, 
  onOpenChange, 
  insurance, 
  customerId,
  onSuccess 
}: InsuranceReceiptFormProps) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    premio_total: "",
    data_pagamento: "",
    recebido_maiato: false,
    pago_companhia: false,
    estorno: false,
    numero_recibo_companhia: "",
  });

  const createReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
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
        apolice_numero: insurance?.numero_apolice,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        customer_id: customerId,
        recebido_maiato: data.recebido_maiato || false,
        pago_companhia: data.pago_companhia || false,
        estorno: data.estorno || false,
      };
      
      if (data.premio_total) {
        const premioValue = parseFloat(data.premio_total);
        receiptData.premio_total = data.estorno ? -Math.abs(premioValue) : premioValue;
      }
      if (data.data_pagamento) receiptData.data_pagamento = data.data_pagamento;
      if (data.numero_recibo_companhia) receiptData.numero_recibo_companhia = data.numero_recibo_companhia;
      
      const { error } = await supabase.from("insurance_receipts").insert([receiptData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-insurance-receipts", customerId] });
      toast.success("Recibo de seguro criado com sucesso");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao criar recibo: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      premio_total: "",
      data_pagamento: "",
      recebido_maiato: false,
      pago_companhia: false,
      estorno: false,
      numero_recibo_companhia: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReceiptMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Recibo de Seguro</DialogTitle>
        </DialogHeader>
        {insurance && (
          <div className="bg-muted p-3 rounded-md mb-4">
            <p className="text-sm">
              <strong>Apólice:</strong> {insurance.numero_apolice || "-"}
            </p>
            <p className="text-sm">
              <strong>Seguradora:</strong> {insurance.insurance_companies?.nome || "-"}
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Número do recibo da companhia"
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

          <div className="space-y-2 flex items-center gap-2">
            <Checkbox
              id="estorno"
              checked={formData.estorno}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, estorno: checked === true })
              }
            />
            <Label htmlFor="estorno" className="cursor-pointer">É Estorno?</Label>
          </div>

          <div className="space-y-2 flex items-center gap-2">
            <Checkbox 
              id="recebido_maiato"
              checked={formData.recebido_maiato} 
              onCheckedChange={(checked) => {
                setFormData({ 
                  ...formData, 
                  recebido_maiato: !!checked
                });
              }}
            />
            <Label htmlFor="recebido_maiato" className="cursor-pointer">Recebido Maiato</Label>
          </div>

          <div className="space-y-2 flex items-center gap-2">
            <Checkbox 
              id="pago_companhia"
              checked={formData.pago_companhia} 
              onCheckedChange={(checked) => {
                setFormData({ 
                  ...formData, 
                  pago_companhia: !!checked
                });
              }}
            />
            <Label htmlFor="pago_companhia" className="cursor-pointer">Pago Companhia</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createReceiptMutation.isPending}>
              Criar Recibo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
