"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, X, Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlogEditor } from "@/components/blog-editor";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GoogleImageSearch } from "@/components/google-image-search";
import { useBlog, useUpdateBlog } from "@/hooks/use-blogs";
import { formatDate } from "@/lib/utils";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "Content is required"),
  featuredImageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(200).optional().or(z.literal("")),
});

type BlogFormData = z.input<typeof blogSchema>;

const tagSuggestions = [
  "news",
  "guide",
  "tutorial",
  "review",
  "hardware",
  "software",
  "gaming",
  "productivity",
  "tips",
  "comparison",
];

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tagInput, setTagInput] = useState("");
  const [showGoogleImageSearch, setShowGoogleImageSearch] = useState(false);

  const { data: blog, isLoading: isBlogLoading } = useBlog(id);
  const updateBlog = useUpdateBlog();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImageUrl: "",
      status: "draft",
      tags: [],
      metaTitle: "",
      metaDescription: "",
    },
  });

  useEffect(() => {
    if (blog) {
      reset(
        {
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt || "",
          content: blog.content,
          featuredImageUrl: blog.featuredImageUrl || "",
          status: blog.status as "draft" | "published",
          tags: blog.tags || [],
          metaTitle: blog.metaTitle || "",
          metaDescription: blog.metaDescription || "",
        },
        {
          keepDirty: false,
          keepDirtyValues: false,
        }
      );
    }
  }, [blog, reset]);

  const tags = watch("tags") || [];
  const featuredImageUrl = watch("featuredImageUrl");
  const currentStatus = watch("status");

  const onSubmit = async (data: BlogFormData) => {
    const submitData = {
      ...data,
      featuredImageUrl: data.featuredImageUrl || undefined,
    };
    await updateBlog.mutateAsync({ id, data: submitData });
    router.push(`/blogs/${id}`);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 20) {
      setValue("tags", [...tags, trimmedTag], { shouldDirty: true });
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const handleGoogleImagesSelected = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setValue("featuredImageUrl", imageUrls[0], { shouldDirty: true });
    }
    setShowGoogleImageSearch(false);
  };

  if (isBlogLoading) {
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

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/blogs/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Edit Blog Post</h1>
          <p className="text-muted-foreground">Update your blog article</p>
        </div>
        {isDirty && (
          <Badge variant="warning" className="animate-pulse">
            Unsaved changes
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register("slug")}
                    className={errors.slug ? "border-destructive" : ""}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    rows={2}
                    {...register("excerpt")}
                    placeholder="Brief summary of the post (max 500 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content *</Label>
                  <BlogEditor
                    content={watch("content") || ""}
                    onChange={(html) => setValue("content", html, { shouldDirty: true })}
                    placeholder="Start writing your blog post..."
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive">
                      {errors.content.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addTag(tagInput)}
                  >
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
                        className="cursor-pointer hover:bg-accent"
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
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    {...register("metaTitle")}
                    placeholder="SEO title (max 100 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    rows={2}
                    {...register("metaDescription")}
                    placeholder="SEO description (max 200 characters)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={currentStatus}
                  onValueChange={(value) =>
                    setValue("status", value as "draft" | "published", {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.status.message || "Status is required"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    {...register("featuredImageUrl")}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowGoogleImageSearch(true)}
                    title="Search images"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {featuredImageUrl ? (
                  <div className="relative">
                    <img
                      src={featuredImageUrl}
                      alt="Featured"
                      className="w-full h-40 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() =>
                        setValue("featuredImageUrl", "", { shouldDirty: true })
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-32 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No image selected</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Post Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(blog.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">{formatDate(blog.updatedAt)}</span>
                </div>
                {blog.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published:</span>
                    <span className="font-medium">
                      {formatDate(blog.publishedAt)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Author:</span>
                  <span className="font-medium">{blog.authorName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tags:</span>
                  <span className="font-medium">{tags.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t -mx-6 px-6">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/blogs/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>

      <GoogleImageSearch
        open={showGoogleImageSearch}
        onOpenChange={setShowGoogleImageSearch}
        onSelectImages={handleGoogleImagesSelected}
        maxSelections={1}
      />
    </div>
  );
}
