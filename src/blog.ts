import axios from 'axios';

import { logger } from './logging';
import { config } from './config';
import { BlogFeed, BlogPost } from './interfaces';

const MEDIUM_URL = 'https://medium.com/';

export async function getAggregatedFeed ( maxPosts: number ): Promise<BlogFeed> {
    const aggregatedFeed: BlogFeed = {
        posts: []
    };

    try {
    // Get medium posts up until maxPosts
        const mediumFeed = await getMediumFeed( config.mediumUser, maxPosts );

        // AggregatedFeed is empty, so just replace
        aggregatedFeed.posts = mediumFeed.posts;
    } catch ( err ) {
        logger.error( `Could not get Medium Feed:\n${err}` );
    }

    try {
    // Get ghost blog posts up until maxPosts
        const ghostFeed = await getGhostFeed( config.ghostPublicApiKey, maxPosts );

        // Merge into aggregatedFeed
        aggregatedFeed.posts = aggregatedFeed.posts.concat( ghostFeed.posts );
    } catch ( err ) {
        logger.error( `Could not get Ghost Blog Feed:\n${err}` );
    }

    if ( aggregatedFeed.posts.length != 0 ) {
    // Re-sort the merged posts by timestamp value
        aggregatedFeed.posts.sort( ( a, b ) => b.publishTimestamp - a.publishTimestamp );

        if ( aggregatedFeed.posts.length > maxPosts ) {
            // Only keep maxPosts number of elements from the beginning of the posts array
            aggregatedFeed.posts = aggregatedFeed.posts.slice( 0, maxPosts );
        }
    }

    return aggregatedFeed;
}

export async function getGhostFeed ( apiKey: string, maxPosts: number ): Promise<BlogFeed> {
    const ghostFeed: BlogFeed = {
        posts: []
    };

    try {
        const res = await axios.get( `${config.ghostUrl}/ghost/api/v2/content/posts/?key=${apiKey}&include=tags` );
        const postsObj = <Object> res.data[ 'posts' ];

        if ( postsObj ) {
            for ( const post of Object.values( postsObj ) ) {

                // Get any tag names from the post
                const tags: string[] = [];
                post[ 'tags' ].forEach( tagObj => {
                    tags.push( tagObj[ 'name' ] );
                } );

                // Process the publish date to timestamp and formatted string
                const publishDate = new Date( post[ 'published_at' ] );
                const timestamp = publishDate.valueOf();
                const dateString = publishDate.toLocaleDateString( 'en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                } );

                const ghostPost = <BlogPost> {
                    title: post[ 'title' ],
                    url: post[ 'url' ],
                    publishDate: dateString,
                    publishTimestamp: timestamp,
                    contentSnippet: post[ 'excerpt' ],
                    tags: tags
                };

                // Add the post to our ghostFeed object
                ghostFeed.posts.push( ghostPost );

                // Break out of the loop when we hit maxPosts
                if ( ghostFeed.posts.length == maxPosts ) {
                    break;
                }
            }
        }
    } catch ( err ) {
        logger.error( 'Could not get Ghost feed: ', err );
        return Promise.reject( err );
    }

    return ghostFeed;
}

export async function getMediumFeed ( username: string, maxPosts: number ): Promise<BlogFeed> {
    const mediumFeed: BlogFeed = {
        posts: []
    };

    try {
        const res = await axios.get( `${MEDIUM_URL}${username}/latest?format=json` );

        // Parse the response data to an object, feedObj
        const data = res.data.substr( res.data.indexOf( '{' ) ); // Dirty hack because Medium returns invalid JSON
        const feedObj = <Object> JSON.parse( data );
        if ( !feedObj[ 'success' ] ) {
            logger.error( 'Medium API responded with failure!' );
            return Promise.reject();
        }

        // Extract the posts object to postsObj
        const postsObj = <Object> feedObj[ 'payload' ][ 'references' ][ 'Post' ];

        // If there are posts
        if ( postsObj ) {
            for ( const post of Object.values( postsObj ) ) {
                // Extract post tags
                const tags: string[] = [];
                post[ 'virtuals' ][ 'tags' ].forEach( tagObj => {
                    tags.push( tagObj[ 'name' ] );
                } );

                // Format a date string from milisecond epoch value
                const msEpoch = post[ 'firstPublishedAt' ];
                const publishDate = new Date( msEpoch );
                const timestamp = publishDate.valueOf();
                const dateString = publishDate.toLocaleDateString( 'en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                } );

                // Populate our MediumPost object
                const mediumPost = <BlogPost> {
                    title: post[ 'title' ],
                    url: `${MEDIUM_URL}s/story/${post[ 'uniqueSlug' ]}`,
                    publishDate: dateString,
                    publishTimestamp: timestamp,
                    contentSnippet: post[ 'content' ][ 'subtitle' ],
                    tags: tags
                };

                // Add the medium post to our MediumFeed object
                mediumFeed.posts.push( mediumPost );

                if ( mediumFeed.posts.length == maxPosts ) {
                    break;
                }
            }
        }
    } catch ( err ) {
        logger.error( 'Could not get Medium feed: ', err );
        return Promise.reject<BlogFeed>( err );
    }

    return mediumFeed;
}