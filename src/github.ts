import * as Octokit from '@octokit/rest';

import { logger } from './logging';
import { Repository, Github } from './interfaces';

const octokit = new Octokit();

export async function getUserReposWithStars ( username: string, includeForks: boolean, numberRepos: number, sort: 'stars' | 'forks' | 'updated' ): Promise<Github> {
  let query = `user:${username}`;
  query = ( includeForks ) ? query + ' fork:true' : query;

  const res = await octokit.search.repos( {
    q: query,
    sort: sort,
    per_page: 100,
    order: 'desc',
    page: 1
  } );

  if ( res.headers.status !== '200 OK' ) {
    logger.error( 'Github API returned failure response' );
    return;
  }

  const github = <Github> {
    repositories: []
  };
  let i = 0;
  res.data[ 'items' ].forEach( repoObj => {
    // Only process repositories with at-least 1 star and while we haven't reached the requested count
    if ( i < numberRepos && repoObj[ 'stargazers_count' ] > 0 ) {
      // Get the UNIX timestamp in ms
      const updatedMs = Date.parse( repoObj[ 'updated_at' ] );

      // Convert to a date string
      const updatedDate = new Date( updatedMs ).toLocaleDateString( 'en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      } );

      const repository = <Repository> {
        title: repoObj[ 'name' ],
        url: repoObj[ 'html_url' ],
        description: repoObj[ 'description' ],
        numberStars: repoObj[ 'stargazers_count' ],
        mainLanguage: repoObj[ 'language' ],
        lastUpdated: updatedDate
      };

      if ( repository.mainLanguage == undefined ) {
        repository.mainLanguage = 'Misc';
      }


      github.repositories.push( repository );
      i++;
    }
  } );

  return github;
}