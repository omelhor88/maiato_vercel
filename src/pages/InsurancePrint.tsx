import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const InsurancePrint = () => {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get("ids")?.split(",") || [];
  const [showValueDialog, setShowValueDialog] = useState(true);
  const [companyValues, setCompanyValues] = useState<Record<string, number>>({});

  const { data: selectedReceipts, isLoading, error: queryError } = useQuery({
    queryKey: ["insurance-receipts-print", ids.join(",")],
    queryFn: async () => {
      if (ids.length === 0) {
        return [];
      }
      
      console.log("Fetching receipts for IDs:", ids);
      
      // Buscar dados dos recibos
      const { data: receiptsData, error: receiptsError } = await supabase
        .from("insurance_receipts")
        .select("*")
        .in("id", ids);
      
      if (receiptsError) {
        console.error("Error fetching receipts:", receiptsError);
        throw receiptsError;
      }

      console.log("Receipts found:", receiptsData?.length);

      if (!receiptsData || receiptsData.length === 0) {
        return [];
      }

      // Buscar customer e insurance details para cada recibo
      const receiptsWithDetails = await Promise.all(
        receiptsData.map(async (receipt) => {
          let customerName = "-";
          let insuranceCompanyName = "Sem Seguradora";
          let insuranceCompanyCodigo = "unknown";
          let productName = "-";
          
          // Buscar nome do cliente
          if (receipt.customer_id) {
            const { data: customerData } = await supabase
              .from("customers")
              .select("name")
              .eq("id", receipt.customer_id)
              .maybeSingle();
            customerName = customerData?.name || "-";
          }
          
          // Buscar insurance para obter info da seguradora e produto
          if (receipt.apolice_numero) {
            const { data: insuranceData } = await supabase
              .from("insurance")
              .select("insurance_company_codigo, numero_produto")
              .eq("numero_apolice", receipt.apolice_numero)
              .maybeSingle();
            
            if (insuranceData) {
              // Buscar nome da seguradora se existir codigo
              if (insuranceData.insurance_company_codigo) {
                const { data: companyData } = await supabase
                  .from("insurance_companies")
                  .select("nome, codigo")
                  .eq("codigo", insuranceData.insurance_company_codigo)
                  .maybeSingle();
                
                if (companyData) {
                  insuranceCompanyName = companyData.nome;
                  insuranceCompanyCodigo = companyData.codigo;
                }
              }
              
              // Buscar produto separadamente
              if (insuranceData.numero_produto) {
                const { data: productData } = await supabase
                  .from("insurance_products")
                  .select("nome")
                  .eq("numero_produto", insuranceData.numero_produto)
                  .maybeSingle();
                productName = productData?.nome || "-";
              }
            }
          }
          
          return {
            ...receipt,
            customer_name: customerName,
            insurance_company_name: insuranceCompanyName,
            insurance_company_codigo: insuranceCompanyCodigo,
            product_name: productName,
          };
        })
      );

      console.log("Receipts with details:", receiptsWithDetails.length);
      return receiptsWithDetails;
    },
    enabled: ids.length > 0,
  });

  // Agrupar recibos por seguradora
  const groupedByCompany = selectedReceipts?.reduce((acc: any, receipt: any) => {
    const companyCode = receipt.insurance_company_codigo || "unknown";
    const companyName = receipt.insurance_company_name || "Sem Seguradora";
    
    if (!acc[companyCode]) {
      acc[companyCode] = {
        name: companyName,
        code: companyCode,
        receipts: []
      };
    }
    
    acc[companyCode].receipts.push(receipt);
    return acc;
  }, {}) || {};

  const companies = Object.values(groupedByCompany) as any[];
  
  const handlePrint = () => {
    window.print();
  };

  const handleConfirmValues = async () => {
    setShowValueDialog(false);
    
    // Atualizar todos os recibos selecionados para pago_companhia = true
    try {
      for (const receipt of selectedReceipts || []) {
        await supabase
          .from("insurance_receipts")
          .update({ pago_companhia: true })
          .eq("id", receipt.id);
      }
      toast.success("Recibos marcados como pagos à companhia");
    } catch (error) {
      console.error("Erro ao atualizar recibos:", error);
      toast.error("Erro ao atualizar recibos");
    }
  };

  const handleCompanyValueChange = (companyCode: string, value: number) => {
    setCompanyValues(prev => ({ ...prev, [companyCode]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p>A carregar dados dos recibos...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar recibos</p>
          <p className="text-sm">{String(queryError)}</p>
        </div>
      </div>
    );
  }

  if (!selectedReceipts || selectedReceipts.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-2">Nenhum recibo de seguro encontrado.</p>
          <p className="text-sm text-muted-foreground">IDs recebidos: {ids.join(", ")}</p>
          <p className="text-xs text-muted-foreground mt-2">Abra o console para mais detalhes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Dialog open={showValueDialog} onOpenChange={setShowValueDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Valores a Entregar por Seguradora</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {companies.map((company: any) => {
              const totalPremios = company.receipts.reduce((sum: number, receipt: any) => {
                return sum + (receipt.premio_total || 0);
              }, 0);

              return (
                <div key={company.code} className="space-y-2 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    Total Recebido: <span className="font-semibold text-foreground">{totalPremios.toFixed(2)}€</span>
                  </div>
                  <Label htmlFor={`valor-${company.code}`}>Valor a Entregar:</Label>
                  <Input
                    id={`valor-${company.code}`}
                    type="number"
                    step="0.01"
                    placeholder="Insira o valor a entregar"
                    value={companyValues[company.code] || ""}
                    onChange={(e) => handleCompanyValueChange(company.code, parseFloat(e.target.value) || 0)}
                    className="text-lg"
                  />
                </div>
              );
            })}
            <Button onClick={handleConfirmValues} className="w-full">
              Confirmar e Pré-visualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold">Resumo de Recibos por Seguradora</h1>
          <Button onClick={handlePrint} disabled={showValueDialog}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {companies.map((company: any, companyIndex: number) => {
          const totalPremios = company.receipts.reduce((sum: number, receipt: any) => {
            return sum + (receipt.premio_total || 0);
          }, 0);

          const valorEntrega = companyValues[company.code] || 0;
          const diferenca = totalPremios - valorEntrega;

          return (
            <Card key={company.code} className={`p-4 print:shadow-none ${companyIndex > 0 ? 'page-break' : ''}`}>
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{company.name}</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-foreground">
                        <th className="text-left p-2 text-sm font-semibold">Clientes</th>
                        <th className="text-left p-2 text-sm font-semibold">Apólice nº</th>
                        <th className="text-left p-2 text-sm font-semibold">Produtos</th>
                        <th className="text-left p-2 text-sm font-semibold">Nº recibo</th>
                        <th className="text-left p-2 text-sm font-semibold">Data receb.</th>
                        <th className="text-right p-2 text-sm font-semibold">Prémio total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {company.receipts.map((receipt: any) => (
                        <tr key={receipt.id} className="border-b border-border">
                          <td className="p-2 text-sm">{receipt.customer_name}</td>
                          <td className="p-2 text-sm">{receipt.apolice_numero || "-"}</td>
                          <td className="p-2 text-sm">{receipt.product_name}</td>
                          <td className="p-2 text-sm">{receipt.numero_recibo_seg || "-"}</td>
                          <td className="p-2 text-sm">
                            {receipt.data_pagamento ? new Date(receipt.data_pagamento).toLocaleDateString('pt-PT') : "-"}
                          </td>
                          <td className="p-2 text-sm text-right font-medium">
                            {receipt.premio_total !== undefined && receipt.premio_total !== null 
                              ? `${receipt.premio_total.toFixed(2)} €` 
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex gap-4">
                  <div className="flex-1 border-2 border-foreground p-2">
                    <div className="text-xs font-semibold">Recebido</div>
                    <div className="text-xl font-bold">{totalPremios.toFixed(2)} €</div>
                  </div>
                  <div className="flex-1 border-2 border-foreground p-2">
                    <div className="text-xs font-semibold">A entregar</div>
                    <div className="text-xl font-bold">{valorEntrega.toFixed(2)} €</div>
                  </div>
                  <div className="flex-1 border-2 border-foreground p-2">
                    <div className="text-xs font-semibold">Diferença</div>
                    <div className={`text-xl font-bold ${diferenca < 0 ? 'text-red-600' : diferenca > 0 ? 'text-green-600' : ''}`}>
                      {diferenca.toFixed(2)} €
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-2 border-foreground p-3">
                  <div className="text-sm mb-2">
                    Prestação de contas liquidada no dia ___/___/_______.
                  </div>
                  <div className="text-right text-sm">
                    Pago: _________________
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
          html {
            margin: 0px;
          }
          body {
            margin: 10mm 15mm 10mm 15mm;
          }
        }
      `}</style>
    </div>
  );
};

export default InsurancePrint;
