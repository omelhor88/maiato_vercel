import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(280, 65%, 60%)",
  "hsl(30, 90%, 55%)",
  "hsl(190, 80%, 45%)",
  "hsl(340, 75%, 55%)",
  "hsl(60, 70%, 45%)",
  "hsl(220, 70%, 55%)",
];

const Analytics = () => {
  // Fetch only PAID accounting receipts (excluding pagamentos)
  const { data: receipts } = useQuery({
    queryKey: ["receipts-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("type", "contabilidade")
        .eq("status", "paid")
        .not("paid_date", "is", null)
        .or("sub_type.is.null,sub_type.neq.pagamentos");
      if (error) throw error;
      return data;
    },
  });

  // Fetch service types (excluding pagamentos)
  const { data: serviceTypes } = useQuery({
    queryKey: ["service-types-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_types")
        .select("*")
        .neq("name", "pagamentos")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const getMonthKey = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-PT", { year: "numeric", month: "short" });
  };

  // Get all sub-types from service_types table (excluding pagamentos)
  const getAllSubTypes = () => {
    const subTypes: string[] = [];
    serviceTypes?.forEach(st => {
      if (st.name.toLowerCase() !== "pagamentos") {
        subTypes.push(st.name);
      }
    });
    return subTypes.sort();
  };

  // Calculate monthly data for accounting receipts by sub_type (using paid_date)
  const calculateMonthlyContabilidade = (allSubTypes: string[]) => {
    const monthlyData: Record<string, { 
      month: string; 
      monthKey: string;
      total: number;
      bySubType: Record<string, { amount: number; count: number }>;
      receiptCount: number;
    }> = {};

    receipts?.forEach((receipt) => {
      // Use paid_date for grouping
      if (!receipt.paid_date) return;
      
      const monthKey = getMonthKey(receipt.paid_date);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          month: getMonthLabel(monthKey), 
          monthKey,
          total: 0, 
          bySubType: {},
          receiptCount: 0
        };
        // Initialize all sub-types with zero
        allSubTypes.forEach(st => {
          monthlyData[monthKey].bySubType[st] = { amount: 0, count: 0 };
        });
      }
      
      const amount = parseFloat(receipt.amount.toString());
      monthlyData[monthKey].total += amount;
      monthlyData[monthKey].receiptCount += 1;
      
      const subType = receipt.sub_type || "Sem tipo";
      if (monthlyData[monthKey].bySubType[subType]) {
        monthlyData[monthKey].bySubType[subType].amount += amount;
        monthlyData[monthKey].bySubType[subType].count += 1;
      }
    });

    return Object.values(monthlyData).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  const allSubTypes = getAllSubTypes();
  const monthlyContabilidade = calculateMonthlyContabilidade(allSubTypes);

  // Calculate totals
  const totalContabilidade = monthlyContabilidade.reduce((sum, m) => sum + m.total, 0);
  const totalReceipts = monthlyContabilidade.reduce((sum, m) => sum + m.receiptCount, 0);

  // Calculate totals by sub_type
  const totalsBySubType: Record<string, { amount: number; count: number }> = {};
  allSubTypes.forEach(st => {
    totalsBySubType[st] = { amount: 0, count: 0 };
  });
  monthlyContabilidade.forEach(m => {
    Object.entries(m.bySubType).forEach(([subType, data]) => {
      if (totalsBySubType[subType]) {
        totalsBySubType[subType].amount += data.amount;
        totalsBySubType[subType].count += data.count;
      }
    });
  });

  // Prepare bar chart data
  const barChartData = monthlyContabilidade.map(m => ({
    month: m.month,
    contabilidade: m.total,
  }));

  // Prepare pie chart data
  const pieChartData = allSubTypes
    .map(subType => ({
      name: subType,
      value: totalsBySubType[subType]?.amount || 0,
      count: totalsBySubType[subType]?.count || 0,
    }))
    .filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Análise de Dados</h1>
        <p className="text-muted-foreground">Estatísticas e relatórios do sistema</p>
      </div>

      {/* Totals Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{totalContabilidade.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Recibos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalReceipts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Faturação Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
              <Bar dataKey="contabilidade" fill="hsl(var(--primary))" name="Contabilidade" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Contabilidade by Month Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contabilidade por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                {allSubTypes.map(subType => (
                  <TableHead key={subType} className="text-right">{subType}</TableHead>
                ))}
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead className="text-right">Total Recibos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyContabilidade.map((row) => (
                <TableRow key={row.monthKey}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  {allSubTypes.map(subType => (
                    <TableCell key={subType} className="text-right">
                      <div className="flex flex-col items-end">
                        <span>€{(row.bySubType[subType]?.amount || 0).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({row.bySubType[subType]?.count || 0})
                        </span>
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold">€{row.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{row.receiptCount}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Total</TableCell>
                {allSubTypes.map(subType => (
                  <TableCell key={subType} className="text-right">
                    <div className="flex flex-col items-end">
                      <span>€{(totalsBySubType[subType]?.amount || 0).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({totalsBySubType[subType]?.count || 0})
                      </span>
                    </div>
                  </TableCell>
                ))}
                <TableCell className="text-right">€{totalContabilidade.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totalReceipts}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pie Chart by Sub-Type */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}: €${value.toFixed(2)} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `€${value.toFixed(2)} (${props.payload.count} recibos)`, 
                  name
                ]} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
