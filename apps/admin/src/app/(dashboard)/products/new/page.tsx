"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  Tag,
  Package,
  DollarSign,
  Truck,
  Search,
  Settings,
  FileText,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GoogleImageSearch } from "@/components/google-image-search";
import { MediaUploader } from "@/components/media-uploader";
import { useCreateProduct } from "@/hooks/use-products";
import { toast } from "sonner";
import { useCategories } from "@/hooks/use-categories";
import { slugify } from "@/lib/utils";

// Comprehensive product schema matching the API
const productSchema = z.object({
  // Basic info
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),

  // Pricing - use coerce to handle string inputs from form
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  costPrice: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).optional(),

  // Physical attributes
  weight: z.coerce.number().min(0).optional(),
  dimensions: z.object({
    width: z.coerce.number().min(0).optional(),
    height: z.coerce.number().min(0).optional(),
    depth: z.coerce.number().min(0).optional(),
  }).optional(),

  // Inventory
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  trackInventory: z.boolean(),
  allowBackorder: z.boolean(),

  // Media - allow empty strings to be filtered out before submission
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
  })),
  videos: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
  })),
  thumbnailUrl: z.string().optional(),

  // Organization
  tags: z.array(z.string()),
  features: z.array(z.string()),
  specifications: z.record(z.string()),

  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),

  // Status & flags
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.boolean(),
  isDigital: z.boolean(),
  requiresShipping: z.boolean(),

  // Supplier
  supplierId: z.string().optional(),
  supplierSku: z.string().optional(),
  externalUrl: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Collapsible section component
function FormSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  {description && (
                    <CardDescription>{description}</CardDescription>
                  )}
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Tag suggestions for electronics store
const tagSuggestions = [
  "electronics",
  "arduino",
  "raspberry-pi",
  "esp32",
  "sensors",
  "robotics",
  "iot",
  "diy",
  "maker",
  "microcontroller",
  "led",
  "motor",
  "display",
  "wireless",
  "power-supply",
];

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();

  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [showGoogleImageSearch, setShowGoogleImageSearch] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState(0); // First image is default thumbnail

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "draft",
      stockQuantity: 0,
      lowStockThreshold: 5,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: false,
      isDigital: false,
      requiresShipping: true,
      images: [],
      videos: [],
      tags: [],
      features: [],
      specifications: {},
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images",
  });

  const { fields: videoFields, append: appendVideo, remove: removeVideo } = useFieldArray({
    control,
    name: "videos",
  });

  const tags = watch("tags") || [];
  const features = watch("features") || [];
  const specifications = watch("specifications") || {};

  const onSubmit = async (data: ProductFormData) => {
    // Filter out empty images and videos - only keep entries with valid URLs
    const filteredImages = (data.images || [])
      .filter(img => img.url && img.url.trim())
      .map(img => ({ url: img.url.trim(), alt: img.alt || undefined }));

    const filteredVideos = (data.videos || [])
      .filter(vid => vid.url && vid.url.trim())
      .map(vid => ({ url: vid.url.trim(), title: vid.title || undefined }));

    // Helper to convert 0/NaN/empty to undefined for optional positive number fields
    const positiveOrUndefined = (val: number | undefined): number | undefined => {
      if (val === undefined || val === null || isNaN(val) || val <= 0) {
        return undefined;
      }
      return val;
    };

    // Clean up dimensions - remove if all values are empty/zero
    const cleanDimensions = () => {
      const dims = data.dimensions;
      if (!dims) return undefined;

      const width = positiveOrUndefined(dims.width);
      const height = positiveOrUndefined(dims.height);
      const depth = positiveOrUndefined(dims.depth);

      // Only include dimensions if at least one value is set
      if (width || height || depth) {
        return { width, height, depth };
      }
      return undefined;
    };

    // Transform data to match API expectations
    const apiData = {
      // Required fields
      name: data.name,
      slug: data.slug,
      basePrice: data.basePrice > 0 ? data.basePrice : 0.01, // API requires positive, default to minimum

      // Optional string fields
      description: data.description || undefined,
      shortDescription: data.shortDescription || undefined,
      sku: data.sku || undefined,
      barcode: data.barcode || undefined,
      brand: data.brand || undefined,
      categoryId: data.categoryId || undefined,

      // Optional positive number fields - API requires positive() when present
      costPrice: positiveOrUndefined(data.costPrice),
      compareAtPrice: positiveOrUndefined(data.compareAtPrice),
      weight: positiveOrUndefined(data.weight),

      // Dimensions object
      dimensions: cleanDimensions(),

      // Inventory - these have defaults in API so safe to send
      stockQuantity: data.stockQuantity || 0,
      lowStockThreshold: data.lowStockThreshold || 5,
      trackInventory: data.trackInventory,
      allowBackorder: data.allowBackorder,

      // Media - filtered arrays
      images: filteredImages,
      videos: filteredVideos,
      // Use the selected thumbnail image, or default to first image
      thumbnailUrl: filteredImages.length > 0
        ? filteredImages[Math.min(thumbnailIndex, filteredImages.length - 1)]?.url
        : undefined,

      // Tags, features, specifications
      tags: data.tags || [],
      features: data.features || [],
      specifications: data.specifications || {},

      // SEO
      metaTitle: data.metaTitle || undefined,
      metaDescription: data.metaDescription || undefined,

      // Status flags
      status: data.status,
      isFeatured: data.isFeatured,
      isDigital: data.isDigital,
      requiresShipping: data.requiresShipping,

      // Supplier
      supplierId: data.supplierId || undefined,
      supplierSku: data.supplierSku || undefined,
      externalUrl: data.externalUrl && data.externalUrl.trim() ? data.externalUrl.trim() : undefined,
    };

    await createProduct.mutateAsync(apiData);
    router.push("/products");
  };

  // Handle tag input
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 20) {
      setValue("tags", [...tags, trimmedTag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", tags.filter((t) => t !== tagToRemove));
  };

  // Handle feature input
  const addFeature = () => {
    const trimmedFeature = featureInput.trim();
    if (trimmedFeature && !features.includes(trimmedFeature) && features.length < 20) {
      setValue("features", [...features, trimmedFeature]);
      setFeatureInput("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setValue("features", features.filter((f) => f !== featureToRemove));
  };

  // Handle specification input
  const addSpecification = () => {
    const key = specKey.trim();
    const value = specValue.trim();
    if (key && value) {
      setValue("specifications", { ...specifications, [key]: value });
      setSpecKey("");
      setSpecValue("");
    }
  };

  const removeSpecification = (keyToRemove: string) => {
    const newSpecs = { ...specifications };
    delete newSpecs[keyToRemove];
    setValue("specifications", newSpecs);
  };

  // Handle images selected from Google Image Search
  const handleGoogleImagesSelected = (imageUrls: string[]) => {
    // Filter out empty images and add new ones
    const currentImages = imageFields.filter(img => {
      const url = watch(`images.${imageFields.indexOf(img)}.url`);
      return url && url.trim();
    });

    // Add each new image URL
    imageUrls.forEach((url) => {
      appendImage({ url, alt: "" });
    });

    setShowGoogleImageSearch(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your catalog with all details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <FormSection
              title="Basic Information"
              description="Product name, description, and identifiers"
              icon={Package}
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      {...register("name", {
                        onChange: (e) => {
                          setValue("slug", slugify(e.target.value));
                        }
                      })}
                      placeholder="Arduino Uno R3"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input id="slug" {...register("slug")} placeholder="arduino-uno-r3" />
                    {errors.slug && (
                      <p className="text-sm text-destructive">{errors.slug.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    {...register("shortDescription")}
                    placeholder="Brief product summary (max 500 chars)"
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    {...register("description")}
                    placeholder="Detailed product description..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" {...register("sku")} placeholder="ARD-UNO-R3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" {...register("barcode")} placeholder="0123456789012" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" {...register("brand")} placeholder="Arduino" />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Pricing */}
            <FormSection
              title="Pricing"
              description="Set product prices and costs"
              icon={DollarSign}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("basePrice")}
                    placeholder="0.00"
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare at Price</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("compareAtPrice")}
                    placeholder="Original price for discounts"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("costPrice")}
                    placeholder="Your cost (internal)"
                  />
                </div>
              </div>
            </FormSection>

            {/* Inventory */}
            <FormSection
              title="Inventory"
              description="Stock management and tracking"
              icon={Package}
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Stock Quantity</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      {...register("stockQuantity")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      {...register("lowStockThreshold")}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trackInventory"
                      checked={watch("trackInventory")}
                      onCheckedChange={(checked) => setValue("trackInventory", checked)}
                    />
                    <Label htmlFor="trackInventory">Track inventory</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowBackorder"
                      checked={watch("allowBackorder")}
                      onCheckedChange={(checked) => setValue("allowBackorder", checked)}
                    />
                    <Label htmlFor="allowBackorder">Allow backorders</Label>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Physical Attributes */}
            <FormSection
              title="Shipping & Physical"
              description="Weight, dimensions, and shipping settings"
              icon={Truck}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (g)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("weight")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      min="0"
                      {...register("dimensions.width")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      min="0"
                      {...register("dimensions.height")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Depth (cm)</Label>
                    <Input
                      id="depth"
                      type="number"
                      step="0.1"
                      min="0"
                      {...register("dimensions.depth")}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDigital"
                      checked={watch("isDigital")}
                      onCheckedChange={(checked) => {
                        setValue("isDigital", checked);
                        if (checked) setValue("requiresShipping", false);
                      }}
                    />
                    <Label htmlFor="isDigital">Digital product</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresShipping"
                      checked={watch("requiresShipping")}
                      onCheckedChange={(checked) => setValue("requiresShipping", checked)}
                      disabled={watch("isDigital")}
                    />
                    <Label htmlFor="requiresShipping">Requires shipping</Label>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Media */}
            <FormSection
              title="Media"
              description="Product images and videos"
              icon={ImageIcon}
              defaultOpen={false}
            >
              <div className="space-y-6">
                {/* Images */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Product Images</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGoogleImageSearch(true)}
                      >
                        <Search className="h-4 w-4 mr-1" /> Search Images
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendImage({ url: "", alt: "" })}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Image
                      </Button>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <MediaUploader
                    accept="image"
                    maxFileSize={10485760} // 10MB
                    onUploadComplete={(result) => {
                      appendImage({ url: result.url, alt: "" });
                      toast.success("Image uploaded successfully");
                    }}
                    onUploadError={(error) => toast.error(error)}
                  />

                  {/* Image Preview Grid */}
                  {imageFields.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageFields.map((field, index) => {
                        const imageUrl = watch(`images.${index}.url`);
                        const isThumbnail = index === thumbnailIndex;
                        return (
                          <div key={field.id} className="relative group">
                            <div
                              className={`aspect-square rounded-lg border-2 overflow-hidden bg-muted/50 cursor-pointer transition-all ${
                                isThumbnail
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
                              }`}
                              onClick={() => imageUrl && setThumbnailIndex(index)}
                              title={imageUrl ? "Click to set as thumbnail" : ""}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={watch(`images.${index}.alt`) || `Product image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              {!isThumbnail && imageUrl && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setThumbnailIndex(index)}
                                  title="Set as thumbnail"
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  removeImage(index);
                                  // Adjust thumbnail index if needed
                                  if (index < thumbnailIndex) {
                                    setThumbnailIndex(prev => Math.max(0, prev - 1));
                                  } else if (index === thumbnailIndex && imageFields.length > 1) {
                                    setThumbnailIndex(0);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {/* Thumbnail badge */}
                            {isThumbnail && imageUrl && (
                              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" /> Thumbnail
                              </div>
                            )}
                            {/* Image number badge (only if not thumbnail) */}
                            {(!isThumbnail || !imageUrl) && (
                              <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                {index + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {imageFields.length === 0 ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No images added yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Search Images" or "Add Image" to get started</p>
                    </div>
                  ) : (
                    <>
                    <p className="text-xs text-muted-foreground">
                      Click on an image to set it as the thumbnail. The first image is selected by default.
                    </p>
                    <div className="space-y-2">
                      {imageFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <span className="text-xs text-muted-foreground mt-2.5 w-6">{index + 1}.</span>
                          <div className="flex-1 grid gap-2 sm:grid-cols-2">
                            <Input
                              {...register(`images.${index}.url`)}
                              placeholder="https://example.com/image.jpg"
                            />
                            <Input
                              {...register(`images.${index}.alt`)}
                              placeholder="Alt text (optional)"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </div>

                {/* Videos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Product Videos</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendVideo({ url: "", title: "" })}
                    >
                      <Video className="h-4 w-4 mr-1" /> Add Video
                    </Button>
                  </div>

                  {/* Upload Dropzone for Videos */}
                  <MediaUploader
                    accept="video"
                    maxFileSize={104857600} // 100MB
                    onUploadComplete={(result) => {
                      appendVideo({ url: result.url, title: "" });
                      toast.success("Video uploaded successfully");
                    }}
                    onUploadError={(error) => toast.error(error)}
                  />

                  {videoFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No videos added yet. You can upload videos or paste YouTube/Vimeo URLs.</p>
                  ) : (
                    <div className="space-y-2">
                      {videoFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <div className="flex-1 grid gap-2 sm:grid-cols-2">
                            <Input
                              {...register(`videos.${index}.url`)}
                              placeholder="https://youtube.com/watch?v=..."
                            />
                            <Input
                              {...register(`videos.${index}.title`)}
                              placeholder="Video title (optional)"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVideo(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Tags & Features */}
            <FormSection
              title="Tags & Features"
              description="Organize and highlight product features"
              icon={Tag}
              defaultOpen={false}
            >
              <div className="space-y-6">
                {/* Tags */}
                <div className="space-y-3">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Type and press Enter"
                    />
                    <Button type="button" variant="outline" onClick={() => addTag(tagInput)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tagSuggestions
                      .filter((t) => !tags.includes(t))
                      .slice(0, 8)
                      .map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => addTag(suggestion)}
                        >
                          + {suggestion}
                        </Badge>
                      ))}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive"
                            onClick={() => removeTag(tag)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <Label>Key Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                      placeholder="Add a feature"
                    />
                    <Button type="button" variant="outline" onClick={addFeature}>
                      Add
                    </Button>
                  </div>
                  {features.length > 0 && (
                    <ul className="space-y-1">
                      {features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-muted/50 p-2 rounded"
                        >
                          <span className="text-sm">• {feature}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(feature)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Specifications */}
            <FormSection
              title="Specifications"
              description="Technical specifications and details"
              icon={FileText}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Specification name (e.g., Voltage)"
                  />
                  <Input
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpecification();
                      }
                    }}
                    placeholder="Value (e.g., 5V)"
                  />
                  <Button type="button" variant="outline" onClick={addSpecification}>
                    Add
                  </Button>
                </div>
                {Object.keys(specifications).length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {Object.entries(specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <span className="font-medium text-sm">{key}</span>
                          <span className="text-sm text-muted-foreground">{value}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecification(key)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>

            {/* SEO */}
            <FormSection
              title="SEO"
              description="Search engine optimization"
              icon={Search}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <span className="text-xs text-muted-foreground">
                      {(watch("metaTitle") || "").length}/60
                    </span>
                  </div>
                  <Input
                    id="metaTitle"
                    {...register("metaTitle")}
                    maxLength={60}
                    placeholder="SEO title (defaults to product name)"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <span className="text-xs text-muted-foreground">
                      {(watch("metaDescription") || "").length}/160
                    </span>
                  </div>
                  <Textarea
                    id="metaDescription"
                    {...register("metaDescription")}
                    maxLength={160}
                    rows={3}
                    placeholder="SEO description for search results"
                  />
                </div>
              </div>
            </FormSection>

            {/* Supplier Information */}
            <FormSection
              title="Supplier Information"
              description="Track supplier and sourcing details"
              icon={Settings}
              defaultOpen={false}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier ID</Label>
                  <Input
                    id="supplierId"
                    {...register("supplierId")}
                    placeholder="Supplier identifier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierSku">Supplier SKU</Label>
                  <Input
                    id="supplierSku"
                    {...register("supplierSku")}
                    placeholder="Supplier's product code"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="externalUrl">External URL</Label>
                  <Input
                    id="externalUrl"
                    {...register("externalUrl")}
                    placeholder="https://alibaba.com/product/..."
                  />
                </div>
              </div>
            </FormSection>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    setValue("status", value as "draft" | "active" | "archived")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={watch("isFeatured")}
                    onCheckedChange={(checked) => setValue("isFeatured", checked)}
                  />
                  <Label htmlFor="isFeatured">Featured product</Label>
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={(value) => setValue("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Stats Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${watch("basePrice") || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-medium">{watch("stockQuantity") || 0} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images:</span>
                  <span className="font-medium">{imageFields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tags:</span>
                  <span className="font-medium">{tags.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specs:</span>
                  <span className="font-medium">{Object.keys(specifications).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Product
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const data = getValues();
              setValue("status", "draft");
              handleSubmit(onSubmit)();
            }}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Google Image Search Dialog */}
      <GoogleImageSearch
        open={showGoogleImageSearch}
        onOpenChange={setShowGoogleImageSearch}
        onSelectImages={handleGoogleImagesSelected}
        multiSelect={true}
        maxSelections={10}
        initialQuery={watch("name") || ""}
      />
    </div>
  );
}
