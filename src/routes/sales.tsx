import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  createSale,
  deleteSale,
  fetchProducts,
  fetchSales,
  formatMoney,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/sales")({
  component: SalesPage,
  head: () => ({
    meta: [
      { title: "Vendas — Vendora" },
      { name: "description", content: "Registre vendas e veja o histórico." },
    ],
  }),
});

const schema = z.object({
  product_id: z.string().uuid("Escolha um produto"),
  quantity: z.number().int().min(1, "Quantidade ≥ 1"),
  unit_price: z.number().min(0),
});

function SalesPage() {
  const qc = useQueryClient();
  const sales = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Venda removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Vendas</h1>
          <p className="text-muted-foreground mt-1">Todas as transações, em ordem cronológica.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              <Plus className="h-4 w-4 mr-1" /> Registrar venda
            </Button>
          </DialogTrigger>
          <SaleDialog onClose={() => setOpen(false)} />
        </Dialog>
      </div>

      <Card className="shadow-[var(--shadow-card)] overflow-hidden">
        {sales.isLoading ? (
          <div className="p-8 text-muted-foreground">Carregando…</div>
        ) : !sales.data || sales.data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma venda ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione produtos em <Link to="/products" className="underline">Produtos</Link> e registre sua primeira venda.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-secondary-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Qtd</th>
                <th className="px-5 py-3 font-medium">Unitário</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sales.data.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-accent/30 transition">
                  <td className="px-5 py-3 text-muted-foreground">
                    {format(new Date(s.sold_at), "dd/MM HH:mm")}
                  </td>
                  <td className="px-5 py-3 font-medium">
                    {s.product?.name ?? <span className="italic text-muted-foreground">excluído</span>}
                  </td>
                  <td className="px-5 py-3 font-mono">{s.quantity}</td>
                  <td className="px-5 py-3 font-mono">{formatMoney(Number(s.unit_price))}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-foreground">
                    {formatMoney(Number(s.total))}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Remover esta venda? O estoque NÃO será restaurado automaticamente.")) del.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function SaleDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const selected = products.data?.find((p) => p.id === productId);

  useEffect(() => {
    if (selected && unitPrice === "") setUnitPrice(String(selected.price));
  }, [selected, unitPrice]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({
        product_id: productId,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
      });
      if (selected && parsed.quantity > selected.stock) {
        throw new Error(`Apenas ${selected.stock} em estoque`);
      }
      await createSale(parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Venda registrada");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-serif text-2xl">Registrar venda</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Produto</Label>
          <Select
            value={productId}
            onValueChange={(v) => {
              setProductId(v);
              const p = products.data?.find((x) => x.id === v);
              if (p) setUnitPrice(String(p.price));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha um produto" />
            </SelectTrigger>
            <SelectContent>
              {(products.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} — {p.stock} em estoque
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Quantidade</Label>
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <Label>Preço unitário</Label>
            <Input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
        </div>
        <div className="rounded-lg bg-secondary/60 px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-serif text-2xl text-foreground">{formatMoney(total)}</span>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending || !productId}
          style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        >
          {save.isPending ? "Salvando…" : "Registrar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}