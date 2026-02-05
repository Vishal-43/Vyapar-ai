import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type ImportStatus = 
  | "PENDING"
  | "PROCESSING"
  | "VALIDATING"
  | "IMPORTING"
  | "COMPLETED"
  | "FAILED"
  | "PARTIAL";

export type ImportType = "SALES_DATA" | "MARKET_PRICES" | "INVENTORY";

interface ValidationError {
  row: number;
  column: string;
  value: any;
  error_message: string;
  suggestion?: string;
}

interface ImportStats {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  inserted_records: number;
  skipped_records: number;
  validation_errors: ValidationError[];
}

interface ImportJob {
  job_id: string;
  status: ImportStatus;
  import_type: ImportType;
  filename: string;
  progress_percentage: number;
  stats?: ImportStats;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_time_remaining?: number;
}

interface UploadResponse {
  job_id: string;
  total_records: number;
  preview: any[];
  status: string;
}

interface DataImportContextType {
  jobs: ImportJob[];
  currentJob: ImportJob | null;
  isLoading: boolean;
  error: string | null;
  uploadFile: (
    file: File,
    importType: ImportType
  ) => Promise<UploadResponse>;
  validateImport: (jobId: string) => Promise<ImportJob>;
  startImport: (
    jobId: string,
    proceedWithErrors: boolean
  ) => Promise<ImportJob>;
  getImportStatus: (jobId: string) => Promise<ImportJob>;
  listImportJobs: (statusFilter?: ImportStatus) => Promise<ImportJob[]>;
  clearCurrentJob: () => void;
}

const DataImportContext = createContext<DataImportContextType | undefined>(
  undefined
);

export const useDataImport = () => {
  const context = useContext(DataImportContext);
  if (!context) {
    throw new Error(
      "useDataImport must be used within DataImportProvider"
    );
  }
  return context;
};

interface DataImportProviderProps {
  children: ReactNode;
}

export const DataImportProvider: React.FC<DataImportProviderProps> = ({
  children,
}) => {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  const uploadFile = async (
    file: File,
    importType: ImportType
  ): Promise<UploadResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${BACKEND_URL}/api/v1/data/import/upload?import_type=${importType}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data: UploadResponse = await response.json();
      setCurrentJob({
        job_id: data.job_id,
        status: "PENDING",
        import_type: importType,
        filename: file.name,
        progress_percentage: 0,
        created_at: new Date().toISOString(),
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const validateImport = async (jobId: string): Promise<ImportJob> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/data/import/validate?job_id=${jobId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Validation failed");
      }

      const job: ImportJob = await response.json();
      setCurrentJob(job);
      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Validation failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startImport = async (
    jobId: string,
    proceedWithErrors: boolean = false
  ): Promise<ImportJob> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/data/import/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job_id: jobId,
            proceed_with_errors: proceedWithErrors,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Import failed to start");
      }

      const job: ImportJob = await response.json();
      setCurrentJob(job);

      const statusCheckInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `${BACKEND_URL}/api/v1/data/import/status/${jobId}`,
            {
              credentials: "include",
            }
          );

          if (statusResponse.ok) {
            const updatedJob: ImportJob = await statusResponse.json();
            setCurrentJob(updatedJob);

            if (
              updatedJob.status === "COMPLETED" ||
              updatedJob.status === "FAILED" ||
              updatedJob.status === "PARTIAL"
            ) {
              clearInterval(statusCheckInterval);
            }
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 2000);

      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Import failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getImportStatus = async (jobId: string): Promise<ImportJob> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/data/import/status/${jobId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get status");
      }

      const job: ImportJob = await response.json();
      setCurrentJob(job);
      return job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get status";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const listImportJobs = async (
    statusFilter?: ImportStatus
  ): Promise<ImportJob[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`${BACKEND_URL}/api/v1/data/import/jobs`);
      if (statusFilter) {
        url.searchParams.append("status_filter", statusFilter);
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to list jobs");
      }

      const jobsList: ImportJob[] = await response.json();
      setJobs(jobsList);
      return jobsList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to list jobs";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentJob = () => {
    setCurrentJob(null);
    setError(null);
  };

  return (
    <DataImportContext.Provider
      value={{
        jobs,
        currentJob,
        isLoading,
        error,
        uploadFile,
        validateImport,
        startImport,
        getImportStatus,
        listImportJobs,
        clearCurrentJob,
      }}
    >
      {children}
    </DataImportContext.Provider>
  );
};
