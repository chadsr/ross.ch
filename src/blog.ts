import axios from 'axios';

import { logger } from './logging';
import { config } from './config';
import { BlogFeed, BlogPost } from './interfaces';

const MEDIUM_API_URL = 'https://https://api.medium.com/v1';

export async function getAggregatedFeed ( maxPosts: number ): Promise<BlogFeed> {
    const aggregatedFeed: BlogFeed = {
        posts: []
    };

    // try {
    //     // Get medium posts up until maxPosts
    //     const mediumFeed = await getMediumFeed( config.mediumUser, maxPosts );

    //     // AggregatedFeed is empty, so just replace
    //     aggregatedFeed.posts = mediumFeed.posts;
    // } catch ( error ) {
    //     logger.error( `Could not get Medium Feed:\n${error}` );
    // }

    try {
        // Get ghost blog posts up until maxPosts
        const ghostFeed = await getGhostFeed( config.ghostPublicApiKey, maxPosts );

        // Merge into aggregatedFeed
        aggregatedFeed.posts = aggregatedFeed.posts.concat( ghostFeed.posts );
    } catch ( error ) {
        logger.error( `Could not get Ghost Blog Feed:\n${error}` );
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
    } catch ( error ) {
        logger.error( 'Could not get Ghost feed: ', error );
        return Promise.reject( error );
    }

    return ghostFeed;
}

export async function getMediumFeed ( username: string, maxPosts: number ): Promise<BlogFeed> {
    const mediumFeed: BlogFeed = {
        posts: []
    };

    try {
        const res = await axios.get( `${MEDIUM_API_URL}users/${username}/publications` );
        const publications = res.data[ 'data' ];

        for ( const post of Object.values( publications ) ) {
            // Extract post tags
            // const tags: string[] = [];
            // post[ 'virtuals' ][ 'tags' ].forEach( tagObj => {
            //     tags.push( tagObj[ 'name' ] );
            // } );

            // // Format a date string from milisecond epoch value
            // const msEpoch = post[ 'firstPublishedAt' ];
            // const publishDate = new Date( msEpoch );
            // const timestamp = publishDate.valueOf();
            // const dateString = publishDate.toLocaleDateString( 'en-GB', {
            //     year: 'numeric',
            //     month: 'short',
            //     day: 'numeric'
            // } );

            // Populate our MediumPost object
            const mediumPost = <BlogPost> {
                title: post[ 'title' ],
                url: post[ 'url' ],
                contentSnippet: post[ 'description' ]
            };

            // Add the medium post to our MediumFeed object
            mediumFeed.posts.push( mediumPost );

            if ( mediumFeed.posts.length == maxPosts ) {
                break;
            }
        }

    } catch ( error ) {
        logger.error( 'Could not get Medium feed: ', error );
        return Promise.reject<BlogFeed>( error );
    }

    return mediumFeed;
}