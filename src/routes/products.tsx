import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  formatMoney,
  updateProduct,
  type Product,
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
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Vendora" },
      { name: "description", content: "Manage your product catalog and stock." },
    ],
  }),
});

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  price: z.number().min(0, "Price must be ≥ 0"),
  stock: z.number().int("Whole number").min(0, "Stock must be ≥ 0"),
});

function ProductsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const del = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Your catalog and live stock.</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              <Plus className="h-4 w-4 mr-1" /> New product
            </Button>
          </DialogTrigger>
          <ProductDialog
            editing={editing}
            onClose={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        </Dialog>
      </div>

      <Card className="shadow-[var(--shadow-card)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No products yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first one to start selling.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-secondary-foreground">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-accent/30 transition">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 font-mono">{formatMoney(Number(p.price))}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        p.stock <= 0
                          ? "text-destructive font-medium"
                          : p.stock < 5
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete ${p.name}?`)) del.mutate(p.id);
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

function ProductDialog({ editing, onClose }: { editing: Product | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? ""));
  const [stock, setStock] = useState(String(editing?.stock ?? ""));

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({
        name,
        price: Number(price),
        stock: Number(stock),
      });
      if (editing) await updateProduct(editing.id, parsed);
      else await createProduct(parsed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(editing ? "Product updated" : "Product created");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-serif text-2xl">
          {editing ? "Edit product" : "New product"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}