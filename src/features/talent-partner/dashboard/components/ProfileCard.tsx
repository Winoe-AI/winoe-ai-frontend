type ProfileCardProps = {
  companyName?: string | null;
  name: string;
  email: string;
  role: string;
};

export function ProfileCard({
  companyName,
  name,
  email,
  role,
}: ProfileCardProps) {
  return (
    <div className="rounded border border-gray-200 p-4">
      <p className="font-medium">{name}</p>
      <p className="text-sm text-secondary">{email}</p>
      {companyName ? (
        <p className="mt-1 text-sm text-secondary">{companyName}</p>
      ) : null}
      <p className="mt-1 text-xs uppercase tracking-wide text-tertiary">
        Role: {role}
      </p>
    </div>
  );
}
