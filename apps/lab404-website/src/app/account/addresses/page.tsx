'use client';

import { useState } from 'react';
import AccountLayout from '@/components/layout/account-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  Address,
  AddressInput,
} from '@/hooks/use-addresses';
import { AddressForm } from '@/components/addresses/address-form';

export default function AddressesPage() {
  const { data: addresses, isLoading, error } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const handleCreate = async (data: AddressInput) => {
    try {
      await createAddress.mutateAsync(data);
      toast.success('Address added successfully');
      setIsAddDialogOpen(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add address';
      toast.error(message);
    }
  };

  const handleUpdate = async (data: AddressInput) => {
    if (!editingAddress) return;
    try {
      await updateAddress.mutateAsync({ id: editingAddress.id, data });
      toast.success('Address updated successfully');
      setEditingAddress(null);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update address';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deletingAddressId) return;
    try {
      await deleteAddress.mutateAsync(deletingAddressId);
      toast.success('Address deleted successfully');
      setDeletingAddressId(null);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete address';
      toast.error(message);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AccountLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AccountLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
              <p className="text-muted-foreground">
                Manage your shipping and billing addresses.
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive mb-4">Failed to load addresses. Please try again.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </AccountLayout>
    );
  }

  // Empty state
  if (!addresses || addresses.length === 0) {
    return (
      <AccountLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
              <p className="text-muted-foreground">
                Manage your shipping and billing addresses.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <AddressForm
                  onSubmit={handleCreate}
                  isSubmitting={createAddress.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No addresses yet. Add your first address to get started!</p>
            </CardContent>
          </Card>
        </div>
      </AccountLayout>
    );
  }

  // Address list with data
  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
            <p className="text-muted-foreground">
              Manage your shipping and billing addresses.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <AddressForm
                onSubmit={handleCreate}
                isSubmitting={createAddress.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Address cards grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {address.type === 'shipping' ? 'Shipping' : 'Billing'}
                  </CardTitle>
                  {address.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingAddress(address)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingAddressId(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">
                  {address.firstName} {address.lastName}
                </p>
                {address.company && <p className="text-muted-foreground">{address.company}</p>}
                <p className="mt-2">{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}
                  {address.state && `, ${address.state}`}
                  {address.postalCode && ` ${address.postalCode}`}
                </p>
                <p>{address.country}</p>
                {address.phone && <p className="mt-2 text-muted-foreground">{address.phone}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingAddress} onOpenChange={(open) => !open && setEditingAddress(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
            </DialogHeader>
            {editingAddress && (
              <AddressForm
                address={editingAddress}
                onSubmit={handleUpdate}
                isSubmitting={updateAddress.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingAddressId} onOpenChange={(open) => !open && setDeletingAddressId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Address</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this address? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteAddress.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteAddress.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AccountLayout>
  );
}
