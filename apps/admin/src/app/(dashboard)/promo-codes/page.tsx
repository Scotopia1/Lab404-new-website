"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
  PromoCode,
} from "@/hooks/use-promo-codes";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PromoCodesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<PromoCode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    minimumOrderAmount: 0,
    maxUses: 0,
    isActive: true,
  });

  const { data: promoCodes, isLoading } = usePromoCodes();
  const createPromo = useCreatePromoCode();
  const updatePromo = useUpdatePromoCode();
  const deletePromo = useDeletePromoCode();

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minimumOrderAmount: 0,
      maxUses: 0,
      isActive: true,
    });
  };

  const handleCreate = async () => {
    await createPromo.mutateAsync(formData);
    setIsAddOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (editPromo) {
      await updatePromo.mutateAsync({ id: editPromo.id, data: formData });
      setEditPromo(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePromo.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const openEdit = (promo: PromoCode) => {
    setEditPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumOrderAmount: promo.minimumOrderAmount || 0,
      maxUses: promo.maxUses || 0,
      isActive: promo.isActive,
    });
  };

  const columns: ColumnDef<PromoCode>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) =>
        row.original.discountType === "percentage"
          ? `${row.original.discountValue}%`
          : formatCurrency(row.original.discountValue),
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => (
        <span>
          {row.original.usedCount}
          {row.original.maxUses ? ` / ${row.original.maxUses}` : ""}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "validTo",
      header: "Expires",
      cell: ({ row }) =>
        row.original.validTo ? formatDate(row.original.validTo) : "Never",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(row.original.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const FormContent = () => (
    <div className="space-y-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="SAVE20"
          />
        </div>
        <div className="space-y-2">
          <Label>Discount Type</Label>
          <Select
            value={formData.discountType}
            onValueChange={(v) =>
              setFormData({
                ...formData,
                discountType: v as "percentage" | "fixed",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Discount Value</Label>
          <Input
            type="number"
            value={formData.discountValue}
            onChange={(e) =>
              setFormData({
                ...formData,
                discountValue: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Minimum Order</Label>
          <Input
            type="number"
            value={formData.minimumOrderAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimumOrderAmount: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Max Uses (0 = unlimited)</Label>
        <Input
          type="number"
          value={formData.maxUses}
          onChange={(e) =>
            setFormData({
              ...formData,
              maxUses: parseInt(e.target.value) || 0,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage discount codes and promotions
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Promo
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={promoCodes || []}
        searchKey="code"
        searchPlaceholder="Search codes..."
        isLoading={isLoading}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPromo} onOpenChange={() => setEditPromo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPromo(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promo code?
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
