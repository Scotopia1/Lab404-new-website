"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Pencil,
  Star,
  FileText,
  User,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useCustomer,
  useCustomerOrders,
  useCustomerAddresses,
} from "@/hooks/use-customers";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: customer, isLoading } = useCustomer(id);
  const { data: orders } = useCustomerOrders(id);
  const { data: addresses } = useCustomerAddresses(id);

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

  const shippingAddresses = addresses?.filter((a) => a.type === "shipping") || [];
  const billingAddresses = addresses?.filter((a) => a.type === "billing") || [];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {customer.firstName} {customer.lastName}
            </h1>
            <Badge variant={customer.isActive ? "success" : "secondary"}>
              {customer.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Customer since {formatDate(customer.createdAt)}
          </p>
          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button asChild>
          <Link href={`/customers/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Customer
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a
                  href={`mailto:${customer.email}`}
                  className="hover:underline"
                >
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Addresses */}
          {shippingAddresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {shippingAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 border rounded-lg space-y-1 text-sm ${
                      addr.isDefault ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {addr.firstName} {addr.lastName}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {addr.company && (
                      <p className="text-muted-foreground">{addr.company}</p>
                    )}
                    <p>{addr.addressLine1}</p>
                    {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                    <p>
                      {addr.city}
                      {addr.state && `, ${addr.state}`}
                      {addr.postalCode && ` ${addr.postalCode}`}
                    </p>
                    <p>{addr.country}</p>
                    {addr.phone && (
                      <p className="text-muted-foreground">{addr.phone}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Billing Addresses */}
          {billingAddresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Billing Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {billingAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 border rounded-lg space-y-1 text-sm ${
                      addr.isDefault ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {addr.firstName} {addr.lastName}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {addr.company && (
                      <p className="text-muted-foreground">{addr.company}</p>
                    )}
                    <p>{addr.addressLine1}</p>
                    {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                    <p>
                      {addr.city}
                      {addr.state && `, ${addr.state}`}
                      {addr.postalCode && ` ${addr.postalCode}`}
                    </p>
                    <p>{addr.country}</p>
                    {addr.phone && (
                      <p className="text-muted-foreground">{addr.phone}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Order History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order History
              </CardTitle>
              {orders && orders.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/orders?customerId=${id}`}>View All</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-medium">#{order.orderNumber}</span>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "success"
                              : order.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      Showing 5 of {orders.length} orders
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
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
                <span className="text-muted-foreground">Paid Orders</span>
                <span className="font-medium text-green-600">{customer.paidOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unpaid Orders</span>
                <span className={`font-medium ${customer.unpaidOrders > 0 ? "text-destructive" : ""}`}>
                  {customer.unpaidOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-medium">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debt</span>
                <span className={`font-medium ${customer.debt > 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(customer.debt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Order Value</span>
                <span className="font-medium">
                  {customer.paidOrders > 0
                    ? formatCurrency(customer.totalSpent / customer.paidOrders)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {formatDate(customer.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active</span>
                {customer.isActive ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Guest Account</span>
                {customer.isGuest ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Marketing</span>
                {customer.acceptsMarketing ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
