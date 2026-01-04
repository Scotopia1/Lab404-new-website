"use client";

import { useState, useMemo } from "react";
import { Search, X, Package, FolderTree, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminProducts, Product } from "@/hooks/use-products";
import { useCategories, Category } from "@/hooks/use-categories";
import { formatCurrency } from "@/lib/utils";

interface ProductCategoryRestrictionsProps {
  selectedProducts: string[];
  selectedCategories: string[];
  onProductsChange: (products: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
}

export function ProductCategoryRestrictions({
  selectedProducts,
  selectedCategories,
  onProductsChange,
  onCategoriesChange,
}: ProductCategoryRestrictionsProps) {
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const { data: productsData, isLoading: productsLoading } = useAdminProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const products = productsData?.data || [];

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const search = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearch.trim()) return categories;
    const search = categorySearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(search));
  }, [categories, categorySearch]);

  // Get selected product details
  const selectedProductDetails = useMemo(() => {
    return products.filter((p) => selectedProducts.includes(p.id));
  }, [products, selectedProducts]);

  // Get selected category details
  const selectedCategoryDetails = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => selectedCategories.includes(c.id));
  }, [categories, selectedCategories]);

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onProductsChange(selectedProducts.filter((id) => id !== productId));
    } else {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const clearAllProducts = () => onProductsChange([]);
  const clearAllCategories = () => onCategoriesChange([]);

  const hasRestrictions = selectedProducts.length > 0 || selectedCategories.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Product Restrictions</CardTitle>
              <CardDescription>
                Limit this promo code to specific products or categories
              </CardDescription>
            </div>
          </div>
          {hasRestrictions && (
            <Badge variant="secondary">
              {selectedProducts.length + selectedCategories.length} restrictions
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Selected Items Summary */}
        {hasRestrictions && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-2">
            {selectedProductDetails.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">
                    Selected Products ({selectedProductDetails.length})
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearAllProducts}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedProductDetails.map((product) => (
                    <Badge
                      key={product.id}
                      variant="outline"
                      className="gap-1 pr-1"
                    >
                      {product.name}
                      <button
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedCategoryDetails.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">
                    Selected Categories ({selectedCategoryDetails.length})
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearAllCategories}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedCategoryDetails.map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      <FolderTree className="h-3 w-3" />
                      {category.name}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
              {selectedProducts.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {selectedProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Categories
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {selectedCategories.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[280px] border rounded-md">
                {productsLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading products...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {productSearch ? "No products found" : "No products available"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {product.sku && (
                                <span className="font-mono">{product.sku}</span>
                              )}
                              <span>{formatCurrency(product.basePrice)}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <p className="text-xs text-muted-foreground">
                {selectedProducts.length === 0
                  ? "No product restrictions - code applies to all products"
                  : `Code will only apply to ${selectedProducts.length} selected product${selectedProducts.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories..."
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[280px] border rounded-md">
                {categoriesLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading categories...
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {categorySearch ? "No categories found" : "No categories available"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCategories.map((category) => {
                      const isSelected = selectedCategories.includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCategory(category.id)}
                          />
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <FolderTree className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <p className="text-xs text-muted-foreground">
                {selectedCategories.length === 0
                  ? "No category restrictions - code applies to all categories"
                  : `Code will only apply to products in ${selectedCategories.length} selected categor${selectedCategories.length > 1 ? "ies" : "y"}`}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {!hasRestrictions && (
          <p className="mt-4 text-sm text-center text-muted-foreground bg-muted/30 rounded-lg p-3">
            This promo code applies to <strong>all products</strong>. Select specific products or categories above to restrict usage.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
