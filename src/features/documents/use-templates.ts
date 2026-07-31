import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import {
  listTemplates,
  uploadTemplate,
  type UploadTemplateInput,
} from "@/features/documents/template.service";
import type { DocumentTemplate } from "@/shared/types/models";

/** Every template version in the catalogue (guide §12 `GET /document-templates`), active and inactive. */
export function useTemplates(): UseQueryResult<DocumentTemplate[]> {
  return useQuery({
    queryKey: queryKeys.documents.templates(),
    queryFn: listTemplates,
  });
}

export type UseActiveTemplatesResult = UseQueryResult<DocumentTemplate[]> & {
  /** Only `isActive: true` templates — what the generate form must offer (guide §12). */
  activeTemplates: DocumentTemplate[] | undefined;
};

/** `useTemplates` filtered to `isActive: true` — the set the generate form renders. */
export function useActiveTemplates(): UseActiveTemplatesResult {
  const query = useTemplates();
  return {
    ...query,
    activeTemplates: query.data?.filter((template) => template.isActive === true),
  };
}

/** Uploads a new template version (guide §12 `POST /document-templates`, Administrator only). */
export function useUploadTemplate(): UseApiMutationResult<DocumentTemplate, UploadTemplateInput> {
  return useApiMutation({
    mutationFn: uploadTemplate,
    invalidateKeys: [queryKeys.documents.templates()],
  });
}
