import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Printer } from "lucide-react";

const CashRegister = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState("");
  const [mbway, setMbway] = useState("");
  const [banco, setBanco] = useState("");
  const [valorDepositar, setValorDepositar] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");

  const { data: receipts } = useQuery({
    queryKey: ["cash-receipts", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*, customers(name)")
        .eq("paid_date", selectedDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const contabilidadeReceipts = receipts || [];
  const totalContabilidade = contabilidadeReceipts.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);

  const { data: insuranceReceipts } = useQuery({
    queryKey: ["cash-insurance-receipts", selectedDate],
    queryFn: async () => {
      const { data: receipts, error } = await supabase
        .from("insurance_receipts")
        .select("*")
        .eq("data_pagamento", selectedDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      // Fetch customer names for each receipt
      const customerIds = receipts?.map(r => r.customer_id).filter(Boolean) || [];
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, name")
          .in("id", customerIds);
        
        const customerMap = new Map(customers?.map(c => [c.id, c.name]) || []);
        return receipts?.map(r => ({
          ...r,
          customer_name: r.customer_id ? customerMap.get(r.customer_id) || '-' : '-'
        })) || [];
      }
      
      return receipts?.map(r => ({ ...r, customer_name: '-' })) || [];
    },
  });

  const segurosReceipts = insuranceReceipts || [];
  const totalSeguros = segurosReceipts.reduce((sum, r) => sum + (r.premio_total ? parseFloat(r.premio_total.toString()) : 0), 0);

  const handleAdvanceToPreview = () => {
    setShowPreview(true);
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  const handlePrint = () => {
    const saldoInicialVal = parseFloat(saldoInicial) || 0;
    const mbwayVal = -(parseFloat(mbway) || 0);
    const bancoVal = -(parseFloat(banco) || 0);
    const valorDepositarVal = parseFloat(valorDepositar) || 0;
    const saldoFinalVal = parseFloat(saldoFinal) || 0;
    
    const totalContaSeguro = totalContabilidade + totalSeguros;
    const totalCaixa = saldoInicialVal + totalContabilidade + totalSeguros + mbwayVal + bancoVal;
    const caixaMenosDeposito = totalCaixa - valorDepositarVal;
    const diferenca = saldoFinalVal - caixaMenosDeposito;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumo dia ${selectedDate}</title>
          <style>
            @page { 
              margin: 15mm;
              size: A4;
            }
            @media print {
              body::after { display: none !important; }
              body::before { display: none !important; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
            h1 { text-align: center; margin-bottom: 15px; font-size: 16px; }
            .container { width: 100%; }
            .tables-section { display: flex; gap: 10px; margin-bottom: 15px; }
            .table-column { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .summary-table { width: 60%; margin: 0 auto; }
            .summary-table th { width: 70%; }
            .summary-table td { width: 30%; text-align: right; font-weight: bold; }
            .total-row { background-color: #e8e8e8; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Resumo dia ${selectedDate}</h1>
            
            <div class="tables-section">
              <div class="table-column">
                <h3 style="margin-bottom: 5px;">Recibos de Contabilidade</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th class="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contabilidadeReceipts.map(r => `
                      <tr>
                        <td>${r.customers?.name || '-'}</td>
                        <td class="text-right">€${parseFloat(r.amount.toString()).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td>Total do Dia:</td>
                      <td class="text-right">€${totalContabilidade.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="table-column">
                <h3 style="margin-bottom: 5px;">Recibos de Seguros</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th class="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${segurosReceipts.map(r => `
                      <tr>
                        <td>${r.customer_name}</td>
                        <td class="text-right">€${(r.premio_total ? parseFloat(r.premio_total.toString()) : 0).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td>Total do Dia:</td>
                      <td class="text-right">€${totalSeguros.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table class="summary-table">
              <tbody>
                <tr>
                  <th>Saldo Inicial</th>
                  <td>€${saldoInicialVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Contabilidade</th>
                  <td>€${totalContabilidade.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Seguros</th>
                  <td>€${totalSeguros.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <th>Total de Contabilidade e Seguros</th>
                  <td>€${totalContaSeguro.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Mbway</th>
                  <td>€${mbwayVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Banco</th>
                  <td>€${bancoVal.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <th>Total da Caixa</th>
                  <td>€${totalCaixa.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Valor a Depositar no Banco</th>
                  <td>€${valorDepositarVal.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <th>Caixa - Depósitos no Banco</th>
                  <td>€${caixaMenosDeposito.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Saldo Final da Caixa</th>
                  <td>€${saldoFinalVal.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <th>Diferença</th>
                  <td>€${diferenca.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setPrintDialogOpen(false);
    setShowPreview(false);
  };

  const saldoInicialVal = parseFloat(saldoInicial) || 0;
  const mbwayVal = -(parseFloat(mbway) || 0);
  const bancoVal = -(parseFloat(banco) || 0);
  const valorDepositarVal = parseFloat(valorDepositar) || 0;
  const saldoFinalVal = parseFloat(saldoFinal) || 0;
  
  const totalContaSeguro = totalContabilidade + totalSeguros;
  const totalCaixa = saldoInicialVal + totalContabilidade + totalSeguros + mbwayVal + bancoVal;
  const caixaMenosDeposito = totalCaixa - valorDepositarVal;
  const diferenca = saldoFinalVal - caixaMenosDeposito;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Caixa</h1>
            <p className="text-muted-foreground">Gestão de caixa diário</p>
          </div>
          <Button onClick={() => setPrintDialogOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Resumo
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Selecionar Data</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recibos de Contabilidade</CardTitle>
            </CardHeader>
            <CardContent>
              {contabilidadeReceipts.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contabilidadeReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>{receipt.customers?.name}</TableCell>
                          <TableCell className="text-right">€{parseFloat(receipt.amount.toString()).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold">Total do Dia:</span>
                    <span className="text-xl font-bold">€{totalContabilidade.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem recibos de contabilidade nesta data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recibos de Seguros</CardTitle>
            </CardHeader>
            <CardContent>
              {segurosReceipts.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segurosReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>{receipt.customer_name}</TableCell>
                          <TableCell className="text-right">€{(receipt.premio_total ? parseFloat(receipt.premio_total.toString()) : 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold">Total do Dia:</span>
                    <span className="text-xl font-bold">€{totalSeguros.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem recibos de seguros nesta data</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={printDialogOpen} onOpenChange={(open) => {
          setPrintDialogOpen(open);
          if (!open) setShowPreview(false);
        }}>
          <DialogContent className="max-h-[80vh] overflow-y-auto max-w-4xl">
            <DialogHeader>
              <DialogTitle>{showPreview ? "Prévia do Resumo do Dia" : "Valores para Resumo do Dia"}</DialogTitle>
            </DialogHeader>
            
            {!showPreview ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="saldoInicial">Saldo Inicial</Label>
                    <Input
                      id="saldoInicial"
                      type="number"
                      step="0.01"
                      value={saldoInicial}
                      onChange={(e) => setSaldoInicial(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mbway">Mbway (valor será negativo)</Label>
                    <Input
                      id="mbway"
                      type="number"
                      step="0.01"
                      value={mbway}
                      onChange={(e) => setMbway(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco (valor será negativo)</Label>
                    <Input
                      id="banco"
                      type="number"
                      step="0.01"
                      value={banco}
                      onChange={(e) => setBanco(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorDepositar">Valor a Depositar no Banco</Label>
                    <Input
                      id="valorDepositar"
                      type="number"
                      step="0.01"
                      value={valorDepositar}
                      onChange={(e) => setValorDepositar(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saldoFinal">Saldo Final da Caixa</Label>
                    <Input
                      id="saldoFinal"
                      type="number"
                      step="0.01"
                      value={saldoFinal}
                      onChange={(e) => setSaldoFinal(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAdvanceToPreview}>Avançar para Prévia</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="space-y-6 py-4">
                  <h2 className="text-xl font-bold text-center">Resumo dia {selectedDate}</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Recibos de Contabilidade</h3>
                      <div className="border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contabilidadeReceipts.map((receipt) => (
                              <TableRow key={receipt.id}>
                                <TableCell className="text-sm">{receipt.customers?.name}</TableCell>
                                <TableCell className="text-right text-sm">€{parseFloat(receipt.amount.toString()).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted">
                              <TableCell>Total do Dia:</TableCell>
                              <TableCell className="text-right">€{totalContabilidade.toFixed(2)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Recibos de Seguros</h3>
                      <div className="border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {segurosReceipts.map((receipt) => (
                              <TableRow key={receipt.id}>
                                <TableCell className="text-sm">{receipt.customer_name}</TableCell>
                                <TableCell className="text-right text-sm">€{(receipt.premio_total ? parseFloat(receipt.premio_total.toString()) : 0).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted">
                              <TableCell>Total do Dia:</TableCell>
                              <TableCell className="text-right">€{totalSeguros.toFixed(2)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded p-4 space-y-3 bg-muted/30">
                    <h3 className="font-semibold mb-3">Resumo Financeiro (Editável)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="preview-saldoInicial">Saldo Inicial</Label>
                        <Input
                          id="preview-saldoInicial"
                          type="number"
                          step="0.01"
                          value={saldoInicial}
                          onChange={(e) => setSaldoInicial(e.target.value)}
                          className="font-semibold"
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-sm font-semibold">€{saldoInicialVal.toFixed(2)}</span>
                      </div>

                      <div className="col-span-2 border-t pt-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Contabilidade</span>
                          <span className="font-semibold">€{totalContabilidade.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Seguros</span>
                          <span className="font-semibold">€{totalSeguros.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="col-span-2 bg-primary/10 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-bold">Total de Contabilidade e Seguros</span>
                          <span className="font-bold">€{totalContaSeguro.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preview-mbway">Mbway</Label>
                        <Input
                          id="preview-mbway"
                          type="number"
                          step="0.01"
                          value={mbway}
                          onChange={(e) => setMbway(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-sm font-semibold text-destructive">€{mbwayVal.toFixed(2)}</span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preview-banco">Banco</Label>
                        <Input
                          id="preview-banco"
                          type="number"
                          step="0.01"
                          value={banco}
                          onChange={(e) => setBanco(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-sm font-semibold text-destructive">€{bancoVal.toFixed(2)}</span>
                      </div>

                      <div className="col-span-2 bg-primary/10 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-bold">Total da Caixa</span>
                          <span className="font-bold">€{totalCaixa.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preview-valorDepositar">Valor a Depositar no Banco</Label>
                        <Input
                          id="preview-valorDepositar"
                          type="number"
                          step="0.01"
                          value={valorDepositar}
                          onChange={(e) => setValorDepositar(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-sm font-semibold">€{valorDepositarVal.toFixed(2)}</span>
                      </div>

                      <div className="col-span-2 bg-primary/10 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-bold">Caixa - Depósitos no Banco</span>
                          <span className="font-bold">€{caixaMenosDeposito.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preview-saldoFinal">Saldo Final da Caixa</Label>
                        <Input
                          id="preview-saldoFinal"
                          type="number"
                          step="0.01"
                          value={saldoFinal}
                          onChange={(e) => setSaldoFinal(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-sm font-semibold">€{saldoFinalVal.toFixed(2)}</span>
                      </div>

                      <div className="col-span-2 bg-primary/20 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-bold text-lg">Diferença</span>
                          <span className={`font-bold text-lg ${diferenca !== 0 ? 'text-destructive' : 'text-green-600'}`}>
                            €{diferenca.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleBackToForm}>Voltar</Button>
                  <Button onClick={handlePrint}>Imprimir</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default CashRegister;
