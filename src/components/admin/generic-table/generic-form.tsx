"use client";

import {
  useForm,
  type FieldValues,
  ControllerRenderProps,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateZodSchema,
  type SchemaInfo,
  type ColumnInfo,
} from "@/lib/admin/schema-generator";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

interface GenericFormProps {
  schemaInfo: SchemaInfo;
  readOnlyColumns?: string[];
  onSubmit: (data: FieldValues) => void;
  onCancel: () => void;
  defaultValues?: Record<string, unknown> | null;
  isSubmitting: boolean;
}

export function GenericForm({
  schemaInfo,
  readOnlyColumns = [],
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting,
}: GenericFormProps) {
  const validationSchema = useMemo(
    () => generateZodSchema(schemaInfo, readOnlyColumns),
    [schemaInfo, readOnlyColumns],
  );

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues || {},
  });

  const renderField = (
    field: ControllerRenderProps<FieldValues, string>,
    col: ColumnInfo,
  ) => {
    const value = field.value ?? "";
    if (readOnlyColumns.includes(col.name)) {
      return (
        <Input
          {...field}
          value={String(value)}
          readOnly
          disabled
          className="bg-muted"
        />
      );
    }

    switch (col.type) {
      case "boolean":
        return (
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder="example@email.com"
            {...field}
            value={String(value)}
          />
        );
      case "url":
        return (
          <Input
            type="url"
            placeholder="https://example.com"
            {...field}
            value={String(value)}
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            placeholder={"+1 (555) 123-4567"}
            {...field}
            value={String(value)}
          />
        );
      case "color":
        return (
          <div className="flex gap-2">
            <Input
              type="color"
              {...field}
              value={String(value) || "#000000"}
              className="h-10 w-16 rounded border p-1"
            />
            <Input
              type="text"
              {...field}
              value={String(value)}
              placeholder={"#000000"}
              className="flex-1"
            />
          </div>
        );
      case "password":
        return <Input type="password" {...field} value={String(value)} />;
      case "text":
      case "textarea":
      case "richtext":
      case "markdown":
        return (
          <Textarea
            {...field}
            value={String(value)}
            rows={col.type === "text" ? 2 : 4}
            placeholder={
              col.type === "markdown"
                ? "Enter markdown text..."
                : col.type === "richtext"
                  ? "Enter rich text content..."
                  : `Enter ${col.name}...`
            }
          />
        );
      case "tags":
        return (
          <Textarea
            {...field}
            value={Array.isArray(value) ? value.join(", ") : String(value)}
            placeholder="Enter tags separated by commas"
            rows={2}
            onChange={(e) => field.onChange(e.target.value)}
          />
        );
      case "file":
      case "image":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={col.type === "image" ? "image/*" : "*/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // For now, just store the file name
                  // In a real implementation, you'd upload the file and store the URL
                  field.onChange(file.name);
                }
              }}
            />
            {value && (
              <div className="text-sm text-gray-500">
                Current file: {String(value)}
              </div>
            )}
          </div>
        );
      case "currency":
        return (
          <div className="relative">
            <span
              className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500"
              data-lingo-skip
            >
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              placeholder={(0).toFixed(2)}
            />
          </div>
        );
      case "filesize":
        return (
          <div className="relative">
            <Input
              type="number"
              min="0"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              placeholder="File size in bytes"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 transform text-sm text-gray-500">
              bytes
            </span>
          </div>
        );
      case "foreign_key":
        return (
          <Input
            {...field}
            value={String(value)}
            placeholder={`Enter ${col.name} ID`}
          />
        );
      case "enum":
        return (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={`Select a ${col.name}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {col.enumValues?.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <Input
            type="number"
            {...field}
            onChange={(e) => field.onChange(Number(e.target.value))}
          />
        );
      case "date":
        return (
          <Input
            type="datetime-local"
            {...field}
            value={value ? new Date(value).toISOString().slice(0, 16) : ""}
          />
        );
      case "json":
        return (
          <Textarea
            {...field}
            value={
              typeof value === "object" && value !== null
                ? JSON.stringify(value, null, 2)
                : String(value)
            }
            placeholder="Enter valid JSON"
            rows={4}
          />
        );
      default:
        return <Input {...field} value={String(value)} />;
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-4 overflow-y-auto p-1"
      >
        {schemaInfo.map((col) => (
          <FormField
            key={col.name}
            control={form.control}
            name={col.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{col.name}</FormLabel>
                <FormControl>{renderField(field, col)}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultValues ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
