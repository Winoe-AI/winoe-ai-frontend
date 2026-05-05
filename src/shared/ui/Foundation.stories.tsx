import React from 'react';

export const Colors = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-xl font-bold mb-4">Backgrounds</h2>
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-primary border border-subtle flex items-center justify-center rounded-md shadow-sm">
          Primary
        </div>
        <div className="w-24 h-24 bg-secondary border border-subtle flex items-center justify-center rounded-md shadow-sm">
          Secondary
        </div>
        <div className="w-24 h-24 bg-elevated border border-subtle flex items-center justify-center rounded-md shadow-sm">
          Elevated
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold mb-4">Text</h2>
      <div className="space-y-2">
        <p className="text-primary">Text Primary</p>
        <p className="text-secondary">Text Secondary</p>
        <p className="text-tertiary">Text Tertiary</p>
        <div className="bg-wheat-500 p-2 w-fit">
          <p className="text-on-accent">Text On Accent</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold mb-4">Warm Wheat</h2>
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-wheat-50 flex items-center justify-center text-xs">
          50
        </div>
        <div className="w-16 h-16 bg-wheat-100 flex items-center justify-center text-xs">
          100
        </div>
        <div className="w-16 h-16 bg-wheat-300 flex items-center justify-center text-xs">
          300
        </div>
        <div className="w-16 h-16 bg-wheat-500 flex items-center justify-center text-xs text-on-accent">
          500
        </div>
        <div className="w-16 h-16 bg-wheat-700 flex items-center justify-center text-xs text-wheat-50">
          700
        </div>
        <div className="w-16 h-16 bg-wheat-900 flex items-center justify-center text-xs text-wheat-50">
          900
        </div>
      </div>
    </section>
  </div>
);

export const Typography = () => (
  <div className="space-y-4">
    <p className="text-display font-sans">Display (72px)</p>
    <p className="text-3xl font-sans">Heading 3XL (48px)</p>
    <p className="text-2xl font-sans">Heading 2XL (32px)</p>
    <p className="text-xl font-sans">Heading XL (24px)</p>
    <p className="text-lg font-sans">Text LG (18px)</p>
    <p className="text-md font-sans">Text MD (16px)</p>
    <p className="text-base font-sans">Text Base (14px)</p>
    <p className="text-sm font-sans">Text SM (13px)</p>
    <p className="text-xs font-sans">Text XS (12px)</p>

    <div className="mt-8">
      <p className="font-serif text-lg">
        Source Serif 4 for narrative reading surfaces.
      </p>
      <p className="font-mono text-sm">Geist Mono for code and data.</p>
    </div>
  </div>
);

export const Spacing = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((s) => (
      <div key={s} className="flex items-center gap-4">
        <div className="w-12 text-sm text-secondary">space-{s}</div>
        <div className={`bg-wheat-300 h-4 w-${s}`}></div>
      </div>
    ))}
  </div>
);

export const Radius = () => (
  <div className="flex gap-4">
    {['none', 'sm', 'md', 'lg', 'xl', 'full'].map((r) => (
      <div
        key={r}
        className={`w-20 h-20 bg-secondary border border-subtle flex items-center justify-center rounded-${r}`}
      >
        {r}
      </div>
    ))}
  </div>
);

export const Shadows = () => (
  <div className="flex gap-8 p-8 bg-primary">
    {['sm', 'md', 'lg'].map((s) => (
      <div
        key={s}
        className={`w-32 h-32 bg-elevated border border-subtle flex items-center justify-center rounded-md shadow-${s}`}
      >
        shadow-{s}
      </div>
    ))}
  </div>
);
