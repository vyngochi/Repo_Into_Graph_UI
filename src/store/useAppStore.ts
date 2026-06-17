import { create } from "zustand";

// --- Types ---
export interface FeatureItem {
    id: string;
    featureName: string;
    description?: string;
    createdAt?: string;
}

export interface BusinessFlow {
    id: string;
    name: string;
    description?: string;
    featureId?: string;
}

export interface AnalysisResult {
    callEdges?: number;
    methods?: number;
    repositoryPath?: string;
    status?: string;
    message?: string;
}

// --- Store State ---
interface AppState {
    // Server config
    serverUrl: string;
    setServerUrl: (url: string) => void;

    // Current repo
    selectedRepoPath: string | null;
    setSelectedRepoPath: (path: string | null) => void;

    // Analysis
    analysisResult: AnalysisResult | null;
    isAnalyzing: boolean;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    setIsAnalyzing: (v: boolean) => void;

    // Features
    features: FeatureItem[];
    setFeatures: (features: FeatureItem[]) => void;

    // Business Flows
    businessFlows: BusinessFlow[];
    setBusinessFlows: (flows: BusinessFlow[]) => void;

    // Toast / notification
    toast: { message: string; type: "success" | "error" | "info" } | null;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    serverUrl: "http://localhost:55061",
    setServerUrl: (url) => set({ serverUrl: url }),

    selectedRepoPath: null,
    setSelectedRepoPath: (path) => set({ selectedRepoPath: path }),

    analysisResult: null,
    isAnalyzing: false,
    setAnalysisResult: (result) => set({ analysisResult: result }),
    setIsAnalyzing: (v) => set({ isAnalyzing: v }),

    features: [],
    setFeatures: (features) => set({ features }),

    businessFlows: [],
    setBusinessFlows: (flows) => set({ businessFlows: flows }),

    toast: null,
    showToast: (message, type = "info") => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3500);
    },
    clearToast: () => set({ toast: null }),
}));