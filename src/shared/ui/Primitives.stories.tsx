import React from 'react';
import Button from './Button';
import { Card } from './Card';
import Input from './Input';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export const Buttons = () => (
  <div className="space-y-4">
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
    <div className="flex gap-4">
      <Button variant="primary" disabled>
        Primary Disabled
      </Button>
      <Button variant="secondary" disabled>
        Secondary Disabled
      </Button>
      <Button variant="ghost" disabled>
        Ghost Disabled
      </Button>
    </div>
    <div className="flex gap-4">
      <Button variant="primary" loading>
        Primary Loading
      </Button>
    </div>
  </div>
);

export const Cards = () => (
  <div className="space-y-4 max-w-md">
    <Card>
      <h3 className="text-lg font-semibold text-primary">Card Title</h3>
      <p className="text-secondary mt-2">
        This is a card with elevated background and subtle border.
      </p>
    </Card>
  </div>
);

export const Inputs = () => (
  <div className="space-y-4 max-w-sm">
    <Input placeholder="Default input..." />
    <Input placeholder="Disabled input..." disabled />
    <Input defaultValue="With value" />
  </div>
);

export const EmptyStates = () => (
  <div className="max-w-md">
    <EmptyState
      title="No items found"
      description="Get started by creating a new item."
      action={
        <Button variant="primary" size="sm">
          Create Item
        </Button>
      }
    />
  </div>
);

export const Skeletons = () => (
  <div className="space-y-4 max-w-md">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-32 w-full mt-8" />
  </div>
);
