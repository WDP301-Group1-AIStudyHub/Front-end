import { apiClient, unwrapApiData } from "./apiClient";

export type MaterialType = "MCQ" | "FLASHCARD";
export type MaterialStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export interface IMcqItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IFlashcardItem {
  front: string;
  back: string;
}

export interface StudyMaterial {
  id: string;
  _id: string;
  title: string;
  userId: string;
  documentId: string;
  type: MaterialType;
  status: MaterialStatus;
  error?: string;
  items: (IMcqItem | IFlashcardItem)[];
  topicsCovered?: string[];
  followUpTopics?: string[];
  createdAt: string;
  updatedAt: string;
}

export const generateStudyMaterial = async (
  documentId: string,
  type: MaterialType,
  count: number,
  difficulty?: string,
  topicFocus?: string
): Promise<StudyMaterial> => {
  const response = await apiClient.post("/api/study-materials/generate", {
    documentId,
    type,
    count,
    difficulty,
    topicFocus,
  });
  return unwrapApiData(response.data, "Failed to generate study materials");
};

export const getStudyMaterialsByDocument = async (
  documentId: string
): Promise<StudyMaterial[]> => {
  const response = await apiClient.get(`/api/study-materials/document/${documentId}`);
  return unwrapApiData(response.data, "Failed to fetch study materials for this document");
};

export const getStudyMaterialById = async (
  id: string
): Promise<StudyMaterial> => {
  const response = await apiClient.get(`/api/study-materials/${id}`);
  return unwrapApiData(response.data, "Failed to fetch study material detail");
};

export const getAllStudyMaterials = async (): Promise<StudyMaterial[]> => {
  const response = await apiClient.get("/api/study-materials");
  return unwrapApiData(response.data, "Failed to fetch all study materials");
};

export const deleteStudyMaterial = async (
  id: string
): Promise<void> => {
  const response = await apiClient.delete(`/api/study-materials/${id}`);
  unwrapApiData(response.data, "Failed to delete study material");
};

export const explainCardConcept = async (
  materialId: string,
  cardIndex: number
): Promise<string> => {
  const response = await apiClient.post("/api/study-materials/explain", {
    materialId,
    cardIndex,
  });
  const data = unwrapApiData<{ explanation: string }>(
    response.data,
    "Failed to generate explanation for this card"
  );
  return data.explanation;
};
