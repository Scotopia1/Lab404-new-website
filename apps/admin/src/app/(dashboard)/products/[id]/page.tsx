"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Pencil,
  ArrowLeft,
  Tag,
  Package,
  DollarSign,
  Boxes,
  Star,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductStatusBadge } from "@/components/shared/status-badge";
import { useProduct } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

export default function ProductPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild variant="outline">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  const images = product.images || [];
  const selectedImage = images[selectedImageIndex]?.url || product.thumbnailUrl;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Preview</h1>
            <p className="text-muted-foreground">Preview how the product looks</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/products/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full aspect-square object-contain bg-muted"
                />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Product Title & Status */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  {product.brand && (
                    <p className="text-muted-foreground">by {product.brand}</p>
                  )}
                </div>
                <ProductStatusBadge status={product.status} />
              </div>

              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.basePrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(product.compareAtPrice!)}
                    </span>
                    <Badge variant="destructive">-{discountPercent}%</Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stockQuantity > 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      In Stock ({product.stockQuantity} available)
                    </span>
                  </>
                ) : product.allowBackorder ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">Available for Backorder</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Out of Stock</span>
                  </>
                )}
              </div>

              {product.isFeatured && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Featured Product
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {(product.description || product.shortDescription) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.shortDescription && (
                  <p className="font-medium">{product.shortDescription}</p>
                )}
                {product.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Category & Tags */}
          {(product.category || (product.tags && product.tags.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.category && (
                  <div>
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Badge variant="outline" className="ml-2">
                      {product.category.name}
                    </Badge>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{key}</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Base Price</p>
              <p className="font-medium">{formatCurrency(product.basePrice)}</p>
            </div>
            {product.costPrice && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cost Price</p>
                <p className="font-medium">{formatCurrency(product.costPrice)}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Stock Quantity</p>
              <p className="font-medium">{product.stockQuantity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Low Stock Threshold</p>
              <p className="font-medium">{product.lowStockThreshold}</p>
            </div>
            {product.weight && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{product.weight} kg</p>
              </div>
            )}
            {product.dimensions && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dimensions</p>
                <p className="font-medium">
                  {product.dimensions.width} x {product.dimensions.height} x{" "}
                  {product.dimensions.depth} cm
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Track Inventory</p>
              <p className="font-medium">{product.trackInventory ? "Yes" : "No"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Requires Shipping</p>
              <p className="font-medium">{product.requiresShipping ? "Yes" : "No"}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Slug</p>
              <p className="font-mono">{product.slug}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Last Updated</p>
              <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
            </div>
            {product.externalUrl && (
              <div className="space-y-1">
                <p className="text-muted-foreground">External URL</p>
                <a
                  href={product.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  View Source
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
