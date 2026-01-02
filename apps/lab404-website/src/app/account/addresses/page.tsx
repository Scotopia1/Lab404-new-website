'use client';

import AccountLayout from '@/components/layout/account-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MapPin, Trash2, Edit2 } from 'lucide-react';

// Mock data
const addresses = [
    {
        id: '1',
        type: 'Default',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
    },
];

export default function AddressesPage() {
    return (
        <AccountLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
                        <p className="text-muted-foreground">
                            Manage your shipping addresses.
                        </p>
                    </div>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {addresses.map((address) => (
                        <Card key={address.id}>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {address.type}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p className="font-medium">{address.firstName} {address.lastName}</p>
                                <p>{address.address}</p>
                                <p>{address.city}, {address.state} {address.zipCode}</p>
                                <p>{address.country}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AccountLayout>
    );
}
