export type PlatformName = "darwin" | "win32" | "unsupported";

export type ConversionFormat = "md" | "docx" | "pdf";

export type CollisionPolicy = "skip" | "overwrite" | "rename";

export type JobItemStatus =
  | "queued"
  | "validating"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

export type EnvironmentIssueCode =
  | "pandoc_not_found"
  | "pdf_engine_missing"
  | "unsupported_platform";

export type EnvironmentIssue = {
  code: EnvironmentIssueCode;
  message: string;
};

export type EnvironmentStatus = {
  pandocAvailable: boolean;
  pandocVersion: string | null;
  pdfExportAvailable: boolean;
  platform: PlatformName;
  issues: EnvironmentIssue[];
};

export type ConversionRequest = {
  inputPaths: string[];
  targetFormat: ConversionFormat;
  outputDirectory: string;
  collisionPolicy: CollisionPolicy;
};

export type JobItem = {
  id: string;
  inputPath: string;
  inputFormat: ConversionFormat;
  outputPath: string | null;
  targetFormat: ConversionFormat;
  status: JobItemStatus;
  errorCode: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversionJob = {
  id: string;
  items: JobItem[];
  summary: {
    total: number;
    queued: number;
    processing: number;
    success: number;
    failed: number;
    skipped: number;
  };
};

export type ConversionCapabilities = {
  supportedTargets: ConversionFormat[];
  experimentalPdfImport: boolean;
  supportedPaths: Array<`${ConversionFormat}->${ConversionFormat}`>;
};

export type JobUpdateEvent = {
  job: ConversionJob;
  itemId?: string;
};

export type MarkdownBridgeApi = {
  getEnvironmentStatus: () => Promise<EnvironmentStatus>;
  pickFiles: () => Promise<string[]>;
  pickOutputDirectory: () => Promise<string | null>;
  openOutputFolder: (outputPath: string) => Promise<void>;
  getCapabilities: () => Promise<ConversionCapabilities>;
  createJob: (request: ConversionRequest) => Promise<ConversionJob>;
  getJob: (jobId: string) => Promise<ConversionJob | null>;
  listJobs: () => Promise<ConversionJob[]>;
  onJobUpdated: (listener: (event: JobUpdateEvent) => void) => () => void;
};
