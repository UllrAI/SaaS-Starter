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
      case "text":
        return <Textarea {...field} value={String(value)} />;
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
