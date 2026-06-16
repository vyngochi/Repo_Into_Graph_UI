// Type declarations for Electron preload bridge

interface AnalyzeParams {
  baseUrl: string;
  repositoryPath: string;
  outputDir?: string | null;
}

interface FeaturesParams {
  baseUrl: string;
}

interface AnalysisRunsParams {
  baseUrl: string;
}

interface FeatureByIdParams {
  baseUrl: string;
  id: string;
}

interface CodeFlowParams {
  baseUrl: string;
  id: string;
}

interface BusinessFlowsParams {
  baseUrl: string;
}

interface BusinessFlowByIdParams {
  baseUrl: string;
  id: string;
}

interface GenerateQuestionsParams {
  baseUrl: string;
  businessFlowId: string;
  numberOfQuestions: number;
  difficulty: string;
  additionalContext?: string | null;
  fewShotExampleIds?: string[] | null;
}

interface FewShotsParams {
  baseUrl: string;
}

interface CreateFewShotParams {
  baseUrl: string;
  payload: any;
}

interface ApiResponse {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

interface GraphScanResult {
  success: boolean;
  nodes?: Array<{
    id: string;
    attributes: {
      label: string;
      size: number;
      color: string;
      ext: string;
      x: number;
      y: number;
    };
  }>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    attributes: { size: number; color: string };
  }>;
  stats?: { files: number; edges: number };
  error?: string;
}

interface GraphReadFileResult {
  success: boolean;
  content?: string;
  lines?: number;
  truncated?: boolean;
  error?: string;
}

declare global {
  interface Window {
    api: {
      analyze: (params: AnalyzeParams) => Promise<ApiResponse>;
      getFeatures: (params: FeaturesParams) => Promise<ApiResponse>;
      getAnalysisRuns: (params: AnalysisRunsParams) => Promise<ApiResponse>;
      getFeatureById: (params: FeatureByIdParams) => Promise<ApiResponse>;
      getCodeFlow: (params: CodeFlowParams) => Promise<ApiResponse>;
      getBusinessFlows: (params: BusinessFlowsParams) => Promise<ApiResponse>;
      getBusinessFlowById: (
        params: BusinessFlowByIdParams,
      ) => Promise<ApiResponse>;
      generateQuestions: (
        params: GenerateQuestionsParams,
      ) => Promise<ApiResponse>;
      getFewShots: (params: FewShotsParams) => Promise<ApiResponse>;
      createFewShot: (params: CreateFewShotParams) => Promise<ApiResponse>;
    };
    dialog: {
      selectFolder: () => Promise<string | null>;
    };
    shell: {
      openExternal: (url: string) => Promise<void>;
    };
    windowControls: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
    graphApi: {
      scanLocal: (folderPath: string) => Promise<GraphScanResult>;
      readFile: (filePath: string) => Promise<GraphReadFileResult>;
    };
  }
}

export {};
