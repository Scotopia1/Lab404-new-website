"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  usePdfTemplates,
  useCreatePdfTemplate,
  useUpdatePdfTemplate,
  useDeletePdfTemplate,
  useSetDefaultPdfTemplate,
  PdfTemplate,
  PdfTemplateInput,
} from "@/hooks/use-pdf-templates";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  isDefault: z.boolean().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
  showCompanyLogo: z.boolean(),
  showLineItemImages: z.boolean(),
  showLineItemDescription: z.boolean(),
  showSku: z.boolean(),
  headerText: z.string().max(500).optional(),
  footerText: z.string().max(500).optional(),
  thankYouMessage: z.string().max(500).optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const defaultFormValues: TemplateFormData = {
  name: "",
  isDefault: false,
  primaryColor: "#1a1a2e",
  accentColor: "#0066cc",
  showCompanyLogo: true,
  showLineItemImages: false,
  showLineItemDescription: false,
  showSku: true,
  headerText: "",
  footerText: "",
  thankYouMessage: "",
};

export default function PdfTemplatesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<PdfTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates, isLoading } = usePdfTemplates();
  const createTemplate = useCreatePdfTemplate();
  const updateTemplate = useUpdatePdfTemplate();
  const deleteTemplate = useDeletePdfTemplate();
  const setDefault = useSetDefaultPdfTemplate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: defaultFormValues,
  });

  const showCompanyLogo = watch("showCompanyLogo");
  const showLineItemImages = watch("showLineItemImages");
  const showLineItemDescription = watch("showLineItemDescription");
  const showSku = watch("showSku");
  const primaryColor = watch("primaryColor");
  const accentColor = watch("accentColor");

  const openCreateDialog = () => {
    reset(defaultFormValues);
    setCreateOpen(true);
  };

  const openEditDialog = (template: PdfTemplate) => {
    setEditTemplate(template);
    reset({
      name: template.name,
      isDefault: template.isDefault,
      primaryColor: template.primaryColor,
      accentColor: template.accentColor,
      showCompanyLogo: template.showCompanyLogo,
      showLineItemImages: template.showLineItemImages,
      showLineItemDescription: template.showLineItemDescription,
      showSku: template.showSku,
      headerText: template.headerText || "",
      footerText: template.footerText || "",
      thankYouMessage: template.thankYouMessage || "",
    });
  };

  const closeDialog = () => {
    setCreateOpen(false);
    setEditTemplate(null);
    reset(defaultFormValues);
  };

  const onSubmit = async (data: TemplateFormData) => {
    const input: PdfTemplateInput = {
      ...data,
      headerText: data.headerText || null,
      footerText: data.footerText || null,
      thankYouMessage: data.thankYouMessage || null,
    };

    if (editTemplate) {
      await updateTemplate.mutateAsync({ id: editTemplate.id, data: input });
    } else {
      await createTemplate.mutateAsync(input);
    }
    closeDialog();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTemplate.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefault.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">PDF Templates</h1>
            <p className="text-muted-foreground">
              Customize the appearance of quotation and invoice PDFs
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates?.data?.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No PDF Templates</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to customize PDF appearance
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates?.data?.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge variant="success" className="mt-1">
                        <Star className="mr-1 h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(template.id)}
                      disabled={template.isDefault}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: template.primaryColor }}
                    title="Primary Color"
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: template.accentColor }}
                    title="Accent Color"
                  />
                  <span className="text-sm text-muted-foreground ml-2">
                    {template.primaryColor} / {template.accentColor}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={template.showCompanyLogo ? "default" : "secondary"}>
                    {template.showCompanyLogo ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                    Logo
                  </Badge>
                  <Badge variant={template.showSku ? "default" : "secondary"}>
                    {template.showSku ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                    SKU
                  </Badge>
                  <Badge variant={template.showLineItemDescription ? "default" : "secondary"}>
                    {template.showLineItemDescription ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                    Description
                  </Badge>
                </div>

                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleSetDefault(template.id)}
                    disabled={setDefault.isPending}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editTemplate} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the appearance and content of your PDF template
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Professional Blue"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={primaryColor}
                      onChange={(e) => setValue("primaryColor", e.target.value)}
                    />
                    <Input
                      {...register("primaryColor")}
                      placeholder="#1a1a2e"
                      className="flex-1"
                    />
                  </div>
                  {errors.primaryColor && (
                    <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={accentColor}
                      onChange={(e) => setValue("accentColor", e.target.value)}
                    />
                    <Input
                      {...register("accentColor")}
                      placeholder="#0066cc"
                      className="flex-1"
                    />
                  </div>
                  {errors.accentColor && (
                    <p className="text-sm text-destructive">{errors.accentColor.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-medium">Display Options</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Company Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Display company logo in the header
                    </p>
                  </div>
                  <Switch
                    checked={showCompanyLogo}
                    onCheckedChange={(v) => setValue("showCompanyLogo", v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show SKU</Label>
                    <p className="text-sm text-muted-foreground">
                      Display product SKU in line items
                    </p>
                  </div>
                  <Switch
                    checked={showSku}
                    onCheckedChange={(v) => setValue("showSku", v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Item Description</Label>
                    <p className="text-sm text-muted-foreground">
                      Display product description under each line item
                    </p>
                  </div>
                  <Switch
                    checked={showLineItemDescription}
                    onCheckedChange={(v) => setValue("showLineItemDescription", v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Item Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Display product images (if available)
                    </p>
                  </div>
                  <Switch
                    checked={showLineItemImages}
                    onCheckedChange={(v) => setValue("showLineItemImages", v)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text</Label>
                  <Textarea
                    id="headerText"
                    {...register("headerText")}
                    placeholder="Custom text to appear at the top of the PDF..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thankYouMessage">Thank You Message</Label>
                  <Textarea
                    id="thankYouMessage"
                    {...register("thankYouMessage")}
                    placeholder="e.g., Thank you for your business!"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    {...register("footerText")}
                    placeholder="Custom text to appear at the bottom of each page..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
