import { GithubRepository } from './interfaces';

import { graphql } from '@octokit/graphql';
import { Config } from './config';
import { Exception } from 'handlebars';

export enum OrderBy {
    PushedAt = 'PUSHED_AT',
    Stargazers = 'STARGAZERS',
}

interface RespositoryQuery {
    data: {
        viewer: {
            repositories: {
                edges: GithubRepository[];
            };
        };
    };
}

const MAX_LANGUAGES = 4;
export async function getRepositoriesWithStars(
    username: string,
    numberRepos: number,
    minStars: number,
    orderBy: OrderBy,
): Promise<GithubRepository[]> {
    const graphqlWithAuth = graphql.defaults({
        headers: {
            authorization: `token ${Config.githubToken}`,
        },
    });

    const resRepos: RespositoryQuery = await graphqlWithAuth(
        `{
          viewer {
            repositories(first: ${numberRepos}, orderBy: {field: ${orderBy}, direction: DESC}, privacy: PUBLIC) {
              edges {
                node {
                  id
                  url
                  name
                  description
                  updatedAt
                  languages(first: ${MAX_LANGUAGES}) {
                    nodes {
                      name
                    }
                  }
                  isFork
                  stargazerCount
                  parent {
                    id
                    url
                    stargazerCount
                    collaborators(first: 1, query: "${username}") {
                      nodes {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
    );

    const repositories: GithubRepository[] = [];
    for (const repo of resRepos.data.viewer.repositories.edges) {
        if (repo.stargazersCount >= minStars) {
            // Only process repositories with at-least 1 star and while we haven't reached the requested count
            if (repo.isFork) {
                // If the repo is a fork, fetch the original repo and check if the username is a contributor
                // if the user is a contributor, then include that repo instead of the fork
                if (repo.parent) {
                    // if collaborators is > 0 then username is a collaborator
                    if (repo.parent.collaborators && repo.parent.collaborators.nodes.length > 0) {
                        // If the parent has more stars, show the parent repo
                        if (repo.stargazersCount < repo.parent.stargazersCount) {
                            repo.id = repo.parent.id;
                            repo.stargazersCount = repo.parent.stargazersCount;
                            repo.url = repo.parent.url;
                        }

                        repo.parent = undefined; // remove the parent reference
                    }
                } else {
                    throw new Exception('Expected parent object due to being a fork');
                }
            }

            // Get the UNIX timestamp in ms
            const updatedMs = Date.parse(repo.updatedAt);

            // Convert to a date string
            repo.updatedAtFormatted = new Date(updatedMs).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            repositories.push(repo);
        }
    }

    return repositories;
}
