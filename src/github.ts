import { Repository, Github } from './interfaces';

import { graphql } from '@octokit/graphql';
import { Config } from './config';

export enum OrderBy {
    PushedAt = 'PUSHED_AT',
}
export async function getUserReposWithStars(numberRepos: number, username: string, orderBy: OrderBy): Promise<Github> {
    console.log(Config.githubToken);
    const graphqlWithAuth = graphql.defaults({
        headers: {
            authorization: Config.githubToken,
        },
    });

    const resRepos = await graphqlWithAuth(
        `{
            viewer {
              repositories(first: ${numberRepos}, orderBy: {field: ${orderBy}, direction: DESC}, privacy: PUBLIC) {
                nodes {
                  id
                  name
                  description
                  isFork
                }
              }
            }
            user(login: "${username}") {
              contributionsCollection {
                repositoryContributions(first: 10) {
                  nodes {
                    repository {
                      id
                      url
                      description
                    }
                  }
                }
              }
            }
          }`,
    );

    // const resRepos = await octokit.search.repos({
    //     q: query,
    //     sort: sort,
    //     per_page: 100,
    //     order: 'desc',
    //     page: 1,
    // });

    // if (resRepos.status !== 200) {
    //     throw new Error('Github API returned failure response');
    // }

    // const resUser = await octokit.users.getByUsername({ username: username });

    // if (resUser.status !== 200) {
    //     throw new Error('Github API returned failure response');
    // }

    const github = <Github>{
        repositories: [],
    };

    let i = 0;
    resRepos['repositories'].forEach(async (repoObj) => {
        // Only process repositories with at-least 1 star and while we haven't reached the requested count
        if (i < numberRepos && repoObj['stargazers_count'] > 0) {
            if (repoObj.fork) {
                // If the repo is a fork, fetch the original repo and check if the username is a contributor
                // if the user is a contributor, then include that repo instead of the fork
            }

            console.log(repoObj);

            // Get the UNIX timestamp in ms
            const updatedMs = Date.parse(repoObj['updated_at']);

            // Convert to a date string
            const updatedDate = new Date(updatedMs).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            const repository = <Repository>{
                title: repoObj['name'],
                url: repoObj['html_url'],
                description: repoObj['description'],
                numberStars: repoObj['stargazers_count'],
                mainLanguage: repoObj['language'],
                lastUpdated: updatedDate,
            };

            if (repository.mainLanguage == undefined) {
                repository.mainLanguage = 'Misc';
            }

            github.repositories.push(repository);
            i++;
        }
    });

    return github;
}
