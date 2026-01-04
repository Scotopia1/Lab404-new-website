"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Pencil,
  Globe,
  GlobeLock,
  Trash2,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BlogStatusBadge } from "@/components/shared/status-badge";
import {
  useBlog,
  useDeleteBlog,
  usePublishBlog,
  useUnpublishBlog,
} from "@/hooks/use-blogs";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function BlogViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: blog, isLoading } = useBlog(id);
  const deleteBlog = useDeleteBlog();
  const publishBlog = usePublishBlog();
  const unpublishBlog = useUnpublishBlog();

  const handleDelete = async () => {
    await deleteBlog.mutateAsync(id);
    router.push("/blogs");
  };

  const handlePublish = async () => {
    await publishBlog.mutateAsync(id);
  };

  const handleUnpublish = async () => {
    await unpublishBlog.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Blog post not found</p>
        <Button variant="outline" onClick={() => router.push("/blogs")}>
          Back to Blogs
        </Button>
      </div>
    );
  }

  const tags = blog.tags || [];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{blog.title}</h1>
            <BlogStatusBadge status={blog.status as "draft" | "published"} />
          </div>
          <p className="text-muted-foreground">/{blog.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {blog.status === "draft" ? (
            <Button onClick={handlePublish} variant="default">
              <Globe className="mr-2 h-4 w-4" />
              Publish
            </Button>
          ) : (
            <Button onClick={handleUnpublish} variant="outline">
              <GlobeLock className="mr-2 h-4 w-4" />
              Unpublish
            </Button>
          )}
          <Button asChild>
            <Link href={`/blogs/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this blog post? This action
                  cannot be undone.
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Image */}
          {blog.featuredImageUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={blog.featuredImageUrl}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Blog Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Content Preview</span>
                {blog.status === "published" && (
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Live
                    </a>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Excerpt */}
              {blog.excerpt && (
                <div className="mb-6">
                  <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                    {blog.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-blue-600 dark:text-blue-400 text-lg font-medium truncate">
                  {blog.metaTitle || blog.title}
                </p>
                <p className="text-green-700 dark:text-green-500 text-sm truncate">
                  www.lab404electronics.com/blog/{blog.slug}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {blog.metaDescription || blog.excerpt || "No description available"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Meta Title:</span>
                  <p className="font-medium">{blog.metaTitle || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Meta Description:</span>
                  <p className="font-medium">{blog.metaDescription || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Author</p>
                  <p className="font-medium">{blog.authorName || "Unknown"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(blog.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(blog.updatedAt)}
                    </p>
                  </div>
                </div>

                {blog.publishedAt && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-sm font-medium">
                        {formatDateTime(blog.publishedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Word Count</span>
                <span className="font-medium">
                  {blog.content
                    .replace(/<[^>]*>/g, "")
                    .split(/\s+/)
                    .filter(Boolean).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reading Time</span>
                <span className="font-medium">
                  {Math.max(
                    1,
                    Math.ceil(
                      blog.content
                        .replace(/<[^>]*>/g, "")
                        .split(/\s+/)
                        .filter(Boolean).length / 200
                    )
                  )}{" "}
                  min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Characters</span>
                <span className="font-medium">
                  {blog.content.replace(/<[^>]*>/g, "").length.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/blogs/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Post
                </Link>
              </Button>
              {blog.status === "published" ? (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleUnpublish}
                >
                  <GlobeLock className="mr-2 h-4 w-4" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handlePublish}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Publish Now
                </Button>
              )}
              {blog.status === "published" && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a
                    href={`/blog/${blog.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live Post
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
