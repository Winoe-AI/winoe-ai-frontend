import React from 'react';
import { WheatStalk } from './WheatStalk';

export const Default = () => (
  <div className="p-8 flex gap-8 text-primary">
    <div className="flex flex-col items-center gap-2">
      <WheatStalk className="w-12 h-12" />
      <span className="text-sm">Neutral</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <WheatStalk className="w-12 h-12" tone="wheat" />
      <span className="text-sm">Wheat Tone</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <WheatStalk className="w-12 h-12" branded />
      <span className="text-sm">Branded</span>
    </div>
  </div>
);
