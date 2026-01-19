const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost/graphql';

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!WORDPRESS_API_URL) {
    throw new Error('NEXT_PUBLIC_WORDPRESS_API_URL is not defined in environment variables');
  }

  try {
    const response = await fetch(WORDPRESS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText} (${response.status})`);
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      throw new Error(json.errors[0]?.message || 'GraphQL error occurred');
    }

    return json.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Fetch error:', error.message);
      console.error('WordPress API URL:', WORDPRESS_API_URL);
    }
    throw error;
  }
}

// Experiment Types
export interface ExperimentNode {
  id: string;
  title: string;
  excerpt: string;
  uri: string;
  experimentNumber?: number;
}

export interface ExperimentEdge {
  node: ExperimentNode;
}

export interface ExperimentsData {
  experiments: {
    edges: ExperimentEdge[];
    pageInfo?: {
      offsetPagination?: {
        total?: number;
      };
    };
  };
}

// Query to get all experiments
export async function getExperiments(): Promise<ExperimentNode[]> {
  const query = `
    query GetExperiments {
      experiments {
        edges {
          node {
            id
            title
            excerpt
            uri
          }
        }
      }
    }
  `;

  const data = await fetchGraphQL<ExperimentsData>(query);
  return data.experiments.edges.map((edge) => edge.node);
}

// Query to get the latest experiment
export async function getLatestExperiment(): Promise<ExperimentNode | null> {
  const query = `
    query GetLatestExperiment {
      experiments(first: 1, where: { orderby: { field: DATE, order: DESC } }) {
        pageInfo {
          offsetPagination {
            total
          }
        }
        edges {
          node {
            id
            title
            excerpt
            uri
          }
        }
      }
    }
  `;

  const data = await fetchGraphQL<ExperimentsData>(query);
  const experimentNode = data.experiments.edges[0]?.node;
  
  if (experimentNode && data.experiments.pageInfo?.offsetPagination?.total) {
    return {
      ...experimentNode,
      experimentNumber: data.experiments.pageInfo.offsetPagination.total,
    };
  }
  
  return experimentNode || null;
}
