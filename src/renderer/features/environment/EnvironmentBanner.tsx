import type { EnvironmentStatus } from "../../../shared/contracts";

type EnvironmentBannerProps = {
  status: EnvironmentStatus | null;
};

export function EnvironmentBanner({ status }: EnvironmentBannerProps) {
  if (!status) {
    return <div className="banner banner--loading">Checking local conversion environment...</div>;
  }

  if (status.issues.length === 0) {
    return (
      <div className="banner banner--success">
        <strong>Environment ready.</strong> Pandoc {status.pandocVersion ?? "detected"} is available.
      </div>
    );
  }

  return (
    <div className="banner banner--warning">
      <strong>Setup required.</strong>
      <ul>
        {status.issues.map((issue) => (
          <li key={issue.code}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

