"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Tag,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { useCreateCustomer } from "@/hooks/use-customers";

const customerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  firstName: z
    .string()
    .max(100, "First name must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
  lastName: z
    .string()
    .max(100, "Last name must be less than 100 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
  phone: z
    .string()
    .max(50, "Phone number must be less than 50 characters")
    .optional()
    .transform((val) => val?.trim() || undefined)
    .refine(
      (val) => !val || /^[+]?[\d\s\-().]+$/.test(val),
      "Please enter a valid phone number"
    ),
  isGuest: z.boolean(),
  isActive: z.boolean(),
  acceptsMarketing: z.boolean(),
  notes: z
    .string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .transform((val) => val?.trim() || undefined),
  tags: z.array(
    z.string().max(50, "Each tag must be less than 50 characters")
  ),
});

type CustomerFormData = z.infer<typeof customerSchema>;

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

const tagSuggestions = [
  "vip",
  "wholesale",
  "retail",
  "new",
  "returning",
  "b2b",
  "b2c",
  "priority",
  "loyalty",
];

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      isGuest: false,
      isActive: true,
      acceptsMarketing: false,
      notes: "",
      tags: [],
    },
  });

  const tags = watch("tags") || [];
  const isActive = watch("isActive");
  const isGuest = watch("isGuest");
  const acceptsMarketing = watch("acceptsMarketing");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue("tags", [...tags, trimmedTag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tagToRemove)
    );
  };

  const onSubmit = async (data: CustomerFormData) => {
    const submitData = {
      ...data,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
      tags: data.tags.length > 0 ? data.tags : undefined,
    };

    const customer = await createCustomer.mutateAsync(submitData);
    router.push(`/customers/${customer.id}`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Customer</h1>
        <p className="text-muted-foreground">
          Create a new customer account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <FormSection
              title="Basic Information"
              description="Customer contact details"
              icon={User}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="customer@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="John"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Doe"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+1 555 123 4567"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Tags */}
            <FormSection
              title="Tags"
              description="Organize customers with tags"
              icon={Tag}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(tagInput)}
                  >
                    Add
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tagSuggestions
                      .filter((s) => !tags.includes(s))
                      .map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => addTag(suggestion)}
                        >
                          + {suggestion}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Admin Notes */}
            <FormSection
              title="Admin Notes"
              description="Internal notes (not visible to customer)"
              icon={FileText}
              defaultOpen={false}
            >
              <div>
                <Textarea
                  {...register("notes")}
                  placeholder="Add notes about this customer..."
                  rows={4}
                  className={errors.notes ? "border-destructive" : ""}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.notes.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 5000 characters
                </p>
              </div>
            </FormSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Customer can log in
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isGuest">Guest</Label>
                    <p className="text-sm text-muted-foreground">
                      Guest checkout customer
                    </p>
                  </div>
                  <Switch
                    id="isGuest"
                    checked={isGuest}
                    onCheckedChange={(checked) => setValue("isGuest", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptsMarketing">Marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Accepts marketing emails
                    </p>
                  </div>
                  <Switch
                    id="acceptsMarketing"
                    checked={acceptsMarketing}
                    onCheckedChange={(checked) =>
                      setValue("acceptsMarketing", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t mt-6 -mx-6 px-6 py-4 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/customers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Customer
          </Button>
        </div>
      </form>
    </div>
  );
}
