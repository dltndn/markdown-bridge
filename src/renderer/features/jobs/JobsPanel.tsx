import type { ConversionJob } from "../../../shared/contracts";

type JobsPanelProps = {
  jobs: ConversionJob[];
  onOpenOutputFolder: (outputPath: string) => void | Promise<void>;
};

export function JobsPanel({ jobs, onOpenOutputFolder }: JobsPanelProps) {
  if (jobs.length === 0) {
    return <p className="empty-state">No jobs yet. Create a conversion batch to see status here.</p>;
  }

  return (
    <div className="jobs-panel">
      {jobs.map((job) => (
        <article key={job.id} className="job-card">
          <header className="job-card__header">
            <div>
              <h3>Job {job.id.slice(0, 8)}</h3>
              <p>
                {job.summary.success} success / {job.summary.failed} failed / {job.summary.skipped} skipped
              </p>
            </div>
            <div className="job-card__header-actions">
              <span className="job-pill">{job.summary.total} items</span>
              {job.items.some((item) => item.outputPath) ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    const outputPath = job.items.find((item) => item.outputPath)?.outputPath;
                    if (outputPath) {
                      void onOpenOutputFolder(outputPath);
                    }
                  }}
                >
                  Open output folder
                </button>
              ) : null}
            </div>
          </header>

          <div className="job-items">
            {job.items.map((item) => (
              <div key={item.id} className={`job-item job-item--${item.status}`}>
                <div>
                  <strong>{item.inputPath.split(/[\\/]/).pop()}</strong>
                  <p>
                    {item.inputFormat} to {item.targetFormat}
                  </p>
                </div>
                <div className="job-item__meta">
                  <span>{item.status}</span>
                  {item.errorMessage ? <small>{item.errorMessage}</small> : null}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
