type Props = {
  verdictOneLiner: string;
  cohortContext?: string;
};

export function ScoreHeadline({ verdictOneLiner, cohortContext }: Props) {
  return (
    <div className="score-headline mx-auto max-w-[680px] space-y-3 text-center">
      <p className="text-lg font-semibold tracking-tight text-primary md:text-xl">
        {verdictOneLiner}
      </p>
      {cohortContext ? (
        <p className="text-sm uppercase tracking-[0.22em] text-secondary">
          {cohortContext}
        </p>
      ) : null}
    </div>
  );
}
