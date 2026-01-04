"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Pencil, Trash2, Eye, Globe, GlobeLock } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { BlogStatusBadge } from "@/components/shared/status-badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  useBlogs,
  useDeleteBlog,
  usePublishBlog,
  useUnpublishBlog,
  Blog,
} from "@/hooks/use-blogs";
import { formatDate } from "@/lib/utils";

export default function BlogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useBlogs({ page, limit });
  const deleteBlog = useDeleteBlog();
  const publishBlog = usePublishBlog();
  const unpublishBlog = useUnpublishBlog();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBlog.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Blog>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.featuredImageUrl ? (
            <img
              src={row.original.featuredImageUrl}
              alt={row.original.title}
              className="h-10 w-16 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No img
            </div>
          )}
          <div>
            <div className="font-medium">{row.original.title}</div>
            <div className="text-sm text-muted-foreground">
              /{row.original.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <BlogStatusBadge status={row.original.status as "draft" | "published"} />,
    },
    {
      accessorKey: "authorName",
      header: "Author",
      cell: ({ row }) => row.original.authorName || "—",
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        if (tags.length === 0) return "—";
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
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
            <DropdownMenuItem asChild>
              <Link href={`/blogs/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/blogs/${row.original.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status === "draft" ? (
              <DropdownMenuItem onClick={() => publishBlog.mutate(row.original.id)}>
                <Globe className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => unpublishBlog.mutate(row.original.id)}>
                <GlobeLock className="mr-2 h-4 w-4" />
                Unpublish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
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

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        <Button asChild>
          <Link href="/blogs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchKey="title"
        searchPlaceholder="Search posts..."
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot
              be undone.
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
