import { zodResolver } from '@hookform/resolvers/zod';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from '@tacocrew/ui-kit';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const meta = {
  title: 'Forms/Field',
  component: Field,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

const formSchema = z.object({
  title: z
    .string()
    .min(5, 'Bug title must be at least 5 characters.')
    .max(32, 'Bug title must be at most 32 characters.'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.')
    .max(100, 'Description must be at most 100 characters.'),
});

function BugReportForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast('You submitted the following values:', {
      description: (
        <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-slate-800 p-4 text-slate-100">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: 'bottom-right',
    });
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Bug Report</CardTitle>
        <CardDescription>Help us improve by reporting bugs you encounter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">Bug Title</FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Login button not working on mobile"
                    autoComplete="off"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-description">Description</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="form-rhf-demo-description"
                      placeholder="I'm having an issue with the login button on mobile."
                      rows={6}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}/100 characters
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    Include steps to reproduce, expected behavior, and what actually happened.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-rhf-demo">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}

/**
 * Complete form example with React Hook Form and Zod validation
 */
export const FormExample: Story = {
  render: () => <BugReportForm />,
};

/**
 * Single field with label and input
 */
export const BasicField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="name">Full Name</FieldLabel>
      <Input id="name" placeholder="John Doe" />
    </Field>
  ),
};

/**
 * Field with description helper text
 */
export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <Input id="password" type="password" placeholder="••••••••" />
      <FieldDescription>Your password must be at least 8 characters.</FieldDescription>
    </Field>
  ),
};

/**
 * Field with error message
 */
export const WithError: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" aria-invalid placeholder="john@example.com" />
      <FieldError errors={[{ type: 'manual', message: 'Invalid email address' }]} />
    </Field>
  ),
};

/**
 * Required field with asterisk
 */
export const RequiredField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="username" required>
        Username
      </FieldLabel>
      <Input id="username" placeholder="johndoe" required />
    </Field>
  ),
};

/**
 * Multiple fields in a group
 */
export const FieldGroupExample: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="first-name">First Name</FieldLabel>
        <Input id="first-name" placeholder="John" />
      </Field>
      <Field>
        <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
        <Input id="last-name" placeholder="Doe" />
      </Field>
      <Field>
        <FieldLabel htmlFor="email-group">Email</FieldLabel>
        <Input id="email-group" type="email" placeholder="john@example.com" />
      </Field>
    </FieldGroup>
  ),
};

/**
 * Horizontal field orientation (label and input side by side)
 */
export const HorizontalOrientation: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Button type="button" variant="outline">
        Cancel
      </Button>
      <Button type="submit">Save Changes</Button>
    </Field>
  ),
};
