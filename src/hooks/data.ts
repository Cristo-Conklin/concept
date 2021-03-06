import { useEffect, useState, useMemo } from 'react';
import { useWebId, useLiveUpdate } from '@solid/react';
import { space, schema } from 'rdf-namespaces';
import { appContainerUrl } from '../utils/urls';
import {
  Resolver, dateResolver, valueResolver, listResolver, listValuesResolver,
  pageListItemsResolver, conceptListItemsResolver,
  pageResolver, conceptResolver, documentResolver
} from '../utils/data';
import data from '@solid/query-ldflex';
import { Document, Concept, Page, PageContainer, PageListItem, ConceptContainer, ConceptListItem } from '../utils/model'

export function useAppContainer() {
  const webId = useWebId();
  const [storage] = useValueQuery(webId, space.storage)
  return storage && appContainerUrl(storage)
}

export function useWorkspace() {
  const appContainer = useAppContainer()
  const workspace = useMemo(() => {
    const workspaceContainer = appContainer && `${appContainer}workspace/`
    const docUri = workspaceContainer && `${workspaceContainer}index.ttl`
    return docUri && {
      docUri,
      uri: `${docUri}#Workspace`,
      containerUri: workspaceContainer,
      subpageContainerUri: `${workspaceContainer}pages/`
    }
  }, [appContainer]);
  return workspace
}

type QueryTerm = string | undefined
type UseQueryResult<T> = [T | undefined, boolean, Error | undefined]
type QueryOptions<T> = { source?: string, skip?: boolean, resolver?: Resolver<T> }

const defaultResolver: Resolver<any> = async (query: any) => query

function useQuery<T>(subject: QueryTerm, predicate: QueryTerm | null, { source = subject, skip = false, resolver = defaultResolver }: QueryOptions<T>): UseQueryResult<T> {
  const { url: updatedUri, timestamp } = useLiveUpdate()
  const [updatedTimestamp, setUpdatedTimestamp] = useState(timestamp)
  useEffect(() => {
    if (!skip && source) {
      try {
        const url = new URL(source)
        url.hash = ''
        const docUri = url.toString()
        if (updatedUri === docUri) {
          setUpdatedTimestamp(timestamp)
        }
      } catch (e) {
        setError(e)
      }
    }
  }, [source, updatedUri, timestamp, skip])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()
  const [result, setResult] = useState<T>()
  useEffect(() => {
    if (!skip && (source !== undefined) && (subject !== undefined) && (predicate !== undefined)) {
      const updateResult = async () => {
        setLoading(true)
        try {
          var query = data.from(source)[subject]
          if (predicate !== null) {
            query = query[predicate]
          }
          setResult(await resolver(query))
        } catch (e) {
          setError(e)
        }
        setLoading(false)
      }
      updateResult()
    }
  }, [source, subject, predicate, updatedTimestamp, resolver, skip])
  return [result, loading, error]
}

export function useListQuery(subject: QueryTerm, predicate: QueryTerm, options: QueryOptions<any[]> = {}) {
  return useQuery(subject, predicate, { resolver: listResolver, ...options })
}

export function useListValuesQuery(subject: QueryTerm, predicate: QueryTerm, options: QueryOptions<any[]> = {}) {
  return useQuery(subject, predicate, { resolver: listValuesResolver, ...options })
}

export function useValueQuery(subject: QueryTerm, predicate: QueryTerm, options: QueryOptions<any> = {}) {
  return useQuery(subject, predicate, { resolver: valueResolver, ...options })
}

export function useDateQuery(subject: QueryTerm, predicate: QueryTerm, options: QueryOptions<any> = {}) {
  return useQuery(subject, predicate, { resolver: dateResolver, ...options })
}


export function usePageListItems(parent: PageContainer | undefined, options: QueryOptions<PageListItem[]> = {}) {
  return useQuery(parent && parent.pagesUri, schema.itemListElement, { resolver: pageListItemsResolver, ...options })
}

export function useConceptListItems(parent: ConceptContainer | undefined, options: QueryOptions<ConceptListItem[]> = {}) {
  return useQuery(parent && parent.conceptsUri, schema.itemListElement, { resolver: conceptListItemsResolver, ...options })
}

export function usePageFromPageListItem(pageListItem: PageListItem, options: QueryOptions<Page> = {}) {
  return useQuery(pageListItem && pageListItem.pageUri, null, { resolver: pageResolver, ...options })
}

export function useConcept(conceptUri: string | undefined, options: QueryOptions<Concept> = {}) {
  return useQuery(conceptUri, null, { resolver: conceptResolver, ...options })
}

export function usePage(pageUri: string | undefined, options: QueryOptions<Page> = {}) {
  return useQuery(pageUri, null, { resolver: pageResolver, ...options })
}

export function useDocument(documentUri: string | undefined, options: QueryOptions<Document> = {}) {
  return useQuery(documentUri, null, { resolver: documentResolver, ...options })
}
