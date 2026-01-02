"use client";

import { useParams } from "next/navigation";
import { Loader2, Mail, Phone, MapPin, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useCustomer, useCustomerOrders } from "@/hooks/use-customers";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: customer, isLoading } = useCustomer(id);
  const { data: orders } = useCustomerOrders(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-muted-foreground">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
        <Badge variant={customer.isActive ? "success" : "secondary"}>
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {customer.addresses && customer.addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 border rounded-lg space-y-1 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{addr.type}</span>
                      {addr.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p>
                      {addr.firstName} {addr.lastName}
                    </p>
                    <p>{addr.address1}</p>
                    {addr.address2 && <p>{addr.address2}</p>}
                    <p>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {(orders as { id: string; orderNumber: string; total: number; status: string; createdAt: string }[]).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <span className="font-medium">#{order.orderNumber}</span>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Badge variant="secondary" className="capitalize">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-medium">{customer.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-medium">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Order Value</span>
                <span className="font-medium">
                  {customer.totalOrders > 0
                    ? formatCurrency(customer.totalSpent / customer.totalOrders)
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
