import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CustomerPrintOptionsProps {
  customer: any;
}

export const CustomerPrintOptions = ({ customer }: CustomerPrintOptionsProps) => {
  const [showIRSDialog, setShowIRSDialog] = useState(false);
  const [showTrabalhadorDialog, setShowTrabalhadorDialog] = useState(false);
  const [showFolhaEntregaDialog, setShowFolhaEntregaDialog] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string[]>([]);
  const [selectedFamilyForFolha, setSelectedFamilyForFolha] = useState<string | null>(null);
  const [maritalStatus, setMaritalStatus] = useState<string>("");
  const [activityStartDate, setActivityStartDate] = useState<string>("");
  const [caeCirs, setCaeCirs] = useState<string>("");
  const [irsAmount, setIrsAmount] = useState<string>("");
  const [irsYear, setIrsYear] = useState<string>(new Date().getFullYear().toString());
  const [irsYearInterno, setIrsYearInterno] = useState<string>((new Date().getFullYear() - 1).toString());
  const [isPaying, setIsPaying] = useState<boolean>(true);

  const { data: familyMembers } = useQuery({
    queryKey: ["family-members", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("customer_id", customer.id);
      if (error) throw error;
      return data || [];
    },
  });

  const handlePrintClick = (type: string) => {
    if (type === "IRS Interno") {
      setShowIRSDialog(true);
      setSelectedFamily([]);
      setMaritalStatus("");
      setIrsYearInterno((new Date().getFullYear() - 1).toString());
    } else if (type === "Trabalhador Independente") {
      setShowTrabalhadorDialog(true);
      setActivityStartDate("");
      setCaeCirs("");
    } else if (type === "Folha de Entrega IRS ao Cliente") {
      setShowFolhaEntregaDialog(true);
      setIrsAmount("");
      setIrsYear(new Date().getFullYear().toString());
      setIsPaying(true);
      setSelectedFamilyForFolha(null);
    } else {
      handlePrint(type);
    }
  };

  const handleIRSPrint = () => {
    if (!maritalStatus || !irsYearInterno) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    handlePrint("IRS Interno");
    setShowIRSDialog(false);
  };

  const handleTrabalhadorPrint = () => {
    if (!activityStartDate || !caeCirs) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    handlePrint("Trabalhador Independente");
    setShowTrabalhadorDialog(false);
  };

  const handleFolhaEntregaPrint = () => {
    if (!irsAmount || !irsYear) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    handlePrint("Folha de Entrega IRS ao Cliente");
    setShowFolhaEntregaDialog(false);
  };

  const handlePrint = (type: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permita pop-ups para imprimir');
      return;
    }

    let content = '';
    const customerInfo = `
      <div style="margin-bottom: 20px;">
        <h2>${customer.name}</h2>
        ${customer.nif ? `<p><strong>NIF:</strong> ${customer.nif}</p>` : ''}
        ${customer.address ? `<p><strong>Morada:</strong> ${customer.address}</p>` : ''}
        ${customer.phone ? `<p><strong>Telefone:</strong> ${customer.phone}</p>` : ''}
        ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
      </div>
    `;

    switch (type) {
      case 'IRS Interno':
        const selectedFamilyData = familyMembers?.filter(fm => selectedFamily.includes(fm.id)) || [];
        const familyLabels = ['A - Pai', 'B - Mãe', 'C', 'D', 'E', 'F', 'G', 'H'];
        
        let subjectsContent = `
          <div style="margin: 30px 0;">
            <h3 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">Sujeitos Envolvidos</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px;">
              <p style="margin: 5px 0; color: #000;"><strong>${familyLabels[0]}:</strong> ${customer.name} - <strong>NIF:</strong> ${customer.nif || 'N/A'}</p>
        `;
        
        selectedFamilyData.forEach((member, index) => {
          const label = familyLabels[index + 1] || `${String.fromCharCode(67 + index)}`;
          subjectsContent += `<p style="margin: 5px 0; color: #000;"><strong>${label}:</strong> ${member.name}</p>`;
        });
        
        subjectsContent += `</div></div>`;
        
        content = `
          <div style="max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #000;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 28px; color: #000; margin-bottom: 5px;">IRS ${irsYearInterno}</h1>
              <div style="width: 60px; height: 3px; background: #000; margin: 0 auto;"></div>
            </div>

            <div style="background: #f8f9fa; border-left: 4px solid #000; padding: 20px; margin-bottom: 25px;">
              <p style="margin: 8px 0; color: #000;"><strong>Cliente:</strong> ${customer.name}</p>
              ${customer.nif ? `<p style="margin: 8px 0; color: #000;"><strong>NIF:</strong> ${customer.nif}</p>` : ''}
              <p style="margin: 8px 0; color: #000;"><strong>Estado Civil:</strong> ${maritalStatus}</p>
            </div>

            ${subjectsContent}

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #000;">
              <p style="font-size: 14px; color: #000;">
                Data: ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        `;
        break;
      case 'Trabalhador Independente':
        content = `
          <div style="max-width: 800px; margin: 0 auto; padding: 40px;">
            <h1 style="text-align: center; font-size: 28px; color: #1a1a1a; margin-bottom: 40px;">Trabalhador Independente</h1>
          
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin-bottom: 25px;">
              <div>
                <p style="margin-bottom: 5px; font-weight: 600; color: #555;">NIF</p>
                <div style="border: 1px solid #333; padding: 10px; background: #fff;">
                  ${customer.nif || ''}
                </div>
              </div>
              <div>
                <p style="margin-bottom: 5px; font-weight: 600; color: #555;">Nome</p>
                <div style="border: 1px solid #333; padding: 10px; background: #fff;">
                  ${customer.name}
                </div>
              </div>
            </div>
          
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; margin-bottom: 30px;">
              <div>
                <p style="margin-bottom: 5px; font-weight: 600; color: #555;">Início Atividade</p>
                <div style="border: 1px solid #333; padding: 10px; background: #fff;">
                  ${activityStartDate ? new Date(activityStartDate).toLocaleDateString('pt-PT') : ''}
                </div>
              </div>
              <div>
                <p style="margin-bottom: 5px; font-weight: 600; color: #555;">CAE/CIRS</p>
                <div style="border: 1px solid #333; padding: 10px; background: #fff;">
                  ${caeCirs}
                </div>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <p style="margin-bottom: 8px; font-weight: 600; color: #555;">IRS</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <th style="border: 1px solid #333; padding: 10px; background: #f0f0f0; font-weight: 600;">IRS 2025</th>
                  <th style="border: 1px solid #333; padding: 10px; background: #f0f0f0; font-weight: 600;">IRS 2026</th>
                  <th style="border: 1px solid #333; padding: 10px; background: #f0f0f0; font-weight: 600;">IRS 2027</th>
                  <th style="border: 1px solid #333; padding: 10px; background: #f0f0f0; font-weight: 600;">IRS 2028</th>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 25px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 25px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 25px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 25px; background: #fff;"></td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 25px;">
              <p style="margin-bottom: 8px; font-weight: 600; color: #555;">IVA</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">Trimestre</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">1º</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">2º</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">3º</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">4º</th>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 8px; background: #f8f9fa; font-weight: 500;">2025</td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 8px; background: #f8f9fa; font-weight: 500;">2026</td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 8px; background: #f8f9fa; font-weight: 500;">2027</td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 20px;">
              <p style="margin-bottom: 8px; font-weight: 600; color: #555;">Segurança Social</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">Trimestre</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">1º</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">2º</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">3º</th>
                  <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0; font-weight: 600;">4º</th>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 8px; background: #f8f9fa; font-weight: 500;">2025</td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 8px; background: #f8f9fa; font-weight: 500;">2026</td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                </tr>
                <tr>
                  <td style="border: 1px solid #333; padding: 8px; background: #f8f9fa; font-weight: 500;">2027</td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                  <td style="border: 1px solid #333; padding: 20px; background: #fff;"></td>
                </tr>
              </table>
            </div>
          </div>
        `;
        break;
      case 'Folha de Entrega IRS ao Cliente':
        const selectedFamilyMember = selectedFamilyForFolha ? familyMembers?.find(fm => fm.id === selectedFamilyForFolha) : null;
        const clientNames = selectedFamilyMember ? `${customer.name} e ${selectedFamilyMember.name}` : customer.name;
        
        content = `
          <div style="max-width: 800px; margin: 0 auto; padding: 60px 40px; font-family: Arial, sans-serif; background: white; color: #000;">
            <div style="text-align: center; margin-bottom: 50px;">
              <h1 style="font-family: Gotham, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; color: #000; margin-bottom: 15px; font-weight: 700; letter-spacing: 1px;">Maiato</h1>
              <div style="width: 60px; height: 3px; background: #000; margin: 0 auto;"></div>
            </div>

            <h2 style="text-align: center; font-size: 24px; color: #000; margin-bottom: 40px; font-weight: 500;">
              Folha de Entrega IRS ${irsYear}
            </h2>

            <div style="background: #f8f9fa; border-left: 4px solid #000; padding: 20px 30px; margin-bottom: 40px;">
              <p style="margin: 8px 0; font-size: 16px; color: #000;"><strong>Cliente:</strong> ${clientNames}</p>
              <p style="margin: 8px 0; font-size: 16px; color: #000;"><strong>Valor:</strong> €${irsAmount}</p>
              <p style="margin: 8px 0; font-size: 16px; color: #000;"><strong>Ano:</strong> ${irsYear}</p>
              <p style="margin: 8px 0; font-size: 16px; color: #000;"><strong>Estado:</strong> ${isPaying ? 'A Pagar' : 'A Receber'}</p>
            </div>

            <div style="margin-top: 120px; text-align: center; padding-top: 40px;">
              <p style="font-family: Gotham, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #000; margin-bottom: 8px;">Maiato</p>
            </div>
          </div>
        `;
        break;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type} - ${customer.name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 0;
              margin: 0;
              width: 210mm;
              min-height: 297mm;
              background: white;
              color: black;
            }
            h1, h2, h3, h4, h5, h6, p, strong, td, th, div, span { 
              color: black !important;
            }
            div, table, td, th {
              background: white !important;
              border-color: black !important;
            }
            h2 { 
              color: #666; 
            }
            h3 {
              color: #555;
              margin-top: 20px;
            }
            p { 
              margin: 8px 0; 
              color: #444;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              border: 1px solid #333;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f0f0f0;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    toast.success(`${type} preparado para impressão`);
  };

  const printOptions = [
    { id: "irs-interno", label: "IRS Interno", icon: FileText },
    { id: "trabalhador-independente", label: "Trabalhador Independente", icon: FileText },
    { id: "folha-entrega-irs", label: "Folha de Entrega IRS ao Cliente", icon: FileText },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opções de Impressão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {printOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto flex-col gap-2 p-6"
              onClick={() => handlePrintClick(option.label)}
            >
              <option.icon className="h-8 w-8" />
              <span className="text-sm font-medium">{option.label}</span>
            </Button>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Cliente:</strong> {customer.name}
          </p>
          {customer.nif && (
            <p className="text-sm text-muted-foreground">
              <strong>NIF:</strong> {customer.nif}
            </p>
          )}
        </div>
      </CardContent>

      <Dialog open={showIRSDialog} onOpenChange={setShowIRSDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar IRS Interno</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Ano do IRS</Label>
              <Input
                type="number"
                value={irsYearInterno}
                onChange={(e) => setIrsYearInterno(e.target.value)}
                placeholder="Ano do IRS"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado Civil</Label>
              <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  <SelectItem value="União de Facto">União de Facto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Familiares a Incluir</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
                <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                  <Checkbox checked disabled />
                  <div className="flex-1">
                    <p className="font-medium">A - Pai/Mãe (Titular)</p>
                    <p className="text-sm text-muted-foreground">{customer.name} - NIF: {customer.nif || 'N/A'}</p>
                  </div>
                </div>
                
                {familyMembers && familyMembers.length > 0 ? (
                  familyMembers.map((member, index) => {
                    const label = index === 0 ? 'B - Mãe/Pai' : `${String.fromCharCode(67 + index - 1)} - Filho(a)`;
                    return (
                      <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={selectedFamily.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFamily([...selectedFamily, member.id]);
                            } else {
                              setSelectedFamily(selectedFamily.filter(id => id !== member.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.name} - {member.relationship}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum familiar cadastrado
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowIRSDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleIRSPrint}>
                Imprimir IRS Interno
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrabalhadorDialog} onOpenChange={setShowTrabalhadorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trabalhador Independente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-start">Início da Atividade</Label>
              <Input
                id="activity-start"
                type="date"
                value={activityStartDate}
                onChange={(e) => setActivityStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cae-cirs">CAE/CIRS</Label>
              <Input
                id="cae-cirs"
                type="text"
                placeholder="Ex: 1519 - OUTROS PRESTADORES DE SERVIÇOS"
                value={caeCirs}
                onChange={(e) => setCaeCirs(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTrabalhadorDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleTrabalhadorPrint}>
                Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFolhaEntregaDialog} onOpenChange={setShowFolhaEntregaDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Folha de Entrega IRS ao Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="irs-year">Ano do IRS</Label>
              <Input
                id="irs-year"
                type="number"
                min="2000"
                max="2100"
                value={irsYear}
                onChange={(e) => setIrsYear(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Incluir Familiar</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={!selectedFamilyForFolha}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedFamilyForFolha(null);
                    }}
                  />
                  <Label className="font-normal cursor-pointer">Apenas {customer.name}</Label>
                </div>
                
                {familyMembers && familyMembers.length > 0 ? (
                  familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFamilyForFolha === member.id}
                        onCheckedChange={(checked) => {
                          setSelectedFamilyForFolha(checked ? member.id : null);
                        }}
                      />
                      <Label className="font-normal cursor-pointer">
                        {customer.name} e {member.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum familiar cadastrado</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Valor</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={isPaying ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsPaying(true)}
                >
                  A Pagar
                </Button>
                <Button
                  type="button"
                  variant={!isPaying ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsPaying(false)}
                >
                  A Receber
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="irs-amount">Valor (€)</Label>
              <Input
                id="irs-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={irsAmount}
                onChange={(e) => setIrsAmount(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowFolhaEntregaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFolhaEntregaPrint}>
                Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
