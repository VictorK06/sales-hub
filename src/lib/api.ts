import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  sold_at: string;
  created_at: string;
};

export type SaleWithProduct = Sale & { product: Pick<Product, "id" | "name"> | null };

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(input: { name: string; price: number; stock: number }) {
  const { error } = await supabase.from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(
  id: string,
  input: { name: string; price: number; stock: number }
) {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSales(): Promise<SaleWithProduct[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*, product:products(id, name)")
    .order("sold_at", { ascending: false });
  if (error) throw error;
  return data as unknown as SaleWithProduct[];
}

export async function createSale(input: { product_id: string; quantity: number; unit_price: number }) {
  const total = +(input.quantity * input.unit_price).toFixed(2);
  const { error } = await supabase.from("sales").insert({ ...input, total });
  if (error) throw error;
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}