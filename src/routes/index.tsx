import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchSales, formatMoney } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Package, Receipt, TrendingUp, Boxes } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Painel — Vendora" },
      { name: "description", content: "Visão geral das suas vendas e estoque." },
    ],
  }),
});

function Index() {
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const sales = useQuery({ queryKey: ["sales"], queryFn: fetchSales });

  const totalRevenue = (sales.data ?? []).reduce((sum, s) => sum + Number(s.total), 0);
  const totalUnits = (sales.data ?? []).reduce((sum, s) => sum + s.quantity, 0);
  const totalStock = (products.data ?? []).reduce((sum, p) => sum + p.stock, 0);

  // 14-day chart
  const days = Array.from({ length: 14 }, (_, i) => startOfDay(subDays(new Date(), 13 - i)));
  const chartData = days.map((d) => {
    const label = format(d, "dd/MM");
    const dayRevenue = (sales.data ?? [])
      .filter((s) => startOfDay(new Date(s.sold_at)).getTime() === d.getTime())
      .reduce((sum, s) => sum + Number(s.total), 0);
    return { day: label, revenue: +dayRevenue.toFixed(2) };
  });

  // top products
  const topMap = new Map<string, { name: string; qty: number; revenue: number }>();
  (sales.data ?? []).forEach((s) => {
    const key = s.product?.id ?? s.product_id;
    const name = s.product?.name ?? "Deleted product";
    const cur = topMap.get(key) ?? { name, qty: 0, revenue: 0 };
    cur.qty += s.quantity;
    cur.revenue += Number(s.total);
    topMap.set(key, cur);
  });
  const topProducts = [...topMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-foreground tracking-tight">Painel</h1>
        <p className="text-muted-foreground mt-1">Uma visão tranquila da sua loja hoje.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Receita total" value={formatMoney(totalRevenue)} highlight />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Vendas registradas" value={String(sales.data?.length ?? 0)} />
        <StatCard icon={<Package className="h-5 w-5" />} label="Unidades vendidas" value={String(totalUnits)} />
        <StatCard icon={<Boxes className="h-5 w-5" />} label="Itens em estoque" value={String(totalStock)} />
      </div>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-serif text-xl mb-4">Receita · últimos 14 dias</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.025 80)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.04 290)" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.04 290)" />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.995 0.005 80)",
                  border: "1px solid oklch(0.88 0.025 80)",
                  borderRadius: 8,
                }}
                formatter={(v: number) => formatMoney(v)}
              />
              <Bar dataKey="revenue" fill="oklch(0.55 0.2 295)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-serif text-xl mb-4">Produtos mais vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma venda ainda — registre uma para ver os mais vendidos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {topProducts.map((p) => (
              <li key={p.name} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.qty} unidades</div>
                </div>
                <div className="font-mono text-sm text-foreground">{formatMoney(p.revenue)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className="p-5 shadow-[var(--shadow-card)] border-border"
      style={highlight ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)" } : undefined}
    >
      <div className="flex items-center gap-2 opacity-80 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-serif text-3xl mt-2 tracking-tight">{value}</div>
    </Card>
  );
}
