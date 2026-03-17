import { useEffect, useState } from "react";
import type { ConversionJob, ConversionRequest, EnvironmentStatus } from "../../shared/contracts";
import { SectionCard } from "../components/SectionCard";
import { ConversionForm } from "../features/conversion/ConversionForm";
import { EnvironmentBanner } from "../features/environment/EnvironmentBanner";
import { JobsPanel } from "../features/jobs/JobsPanel";
import { useJobSubscription } from "../hooks/useJobSubscription";

export function App() {
  const [environment, setEnvironment] = useState<EnvironmentStatus | null>(null);
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [outputDirectory, setOutputDirectory] = useState("");

  useEffect(() => {
    void Promise.all([
      window.markdownBridge.getEnvironmentStatus(),
      window.markdownBridge.listJobs()
    ]).then(([nextEnvironment, nextJobs]) => {
      setEnvironment(nextEnvironment);
      setJobs(nextJobs);
    });
  }, []);

  useJobSubscription((event) => {
    setJobs((currentJobs) => {
      const existing = currentJobs.find((job) => job.id === event.job.id);
      if (!existing) {
        return [event.job, ...currentJobs];
      }

      return currentJobs.map((job) => (job.id === event.job.id ? event.job : job));
    });
  });

  const handleCreateJob = async (request: ConversionRequest) => {
    const job = await window.markdownBridge.createJob(request);
    setJobs((currentJobs) => [job, ...currentJobs.filter((existing) => existing.id !== job.id)]);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Local-first desktop conversion</p>
        <h1>markdown-bridge</h1>
        <p className="hero-copy">
          Markdown-centered document conversion scaffold for Electron, React, TypeScript, and Pandoc.
        </p>
      </section>

      <EnvironmentBanner status={environment} />

      <div className="layout-grid">
        <SectionCard title="Create Batch" description="Pick files, choose a target format, and queue a job through typed IPC.">
          <ConversionForm
            selectedFiles={selectedFiles}
            onFilesChange={setSelectedFiles}
            outputDirectory={outputDirectory}
            onOutputDirectoryChange={setOutputDirectory}
            onSubmit={handleCreateJob}
          />
        </SectionCard>

        <SectionCard title="Job Results" description="Queue state is managed in the Electron main process and streamed back to the renderer.">
          <JobsPanel jobs={jobs} />
        </SectionCard>
      </div>
    </main>
  );
}

