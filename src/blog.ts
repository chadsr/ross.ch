import GhostContentAPI from '@tryghost/content-api';

import { logger } from './logging';
import { Config } from './config';
import { BlogFeed, BlogPost } from './interfaces';

const ghostApi = GhostContentAPI({
    url: Config.ghostUrl,
    key: Config.ghostPublicApiKey,
    version: 'v3',
});

export async function getAggregatedFeed(maxPosts: number): Promise<BlogFeed> {
    const aggregatedFeed: BlogFeed = {
        posts: [],
    };

    try {
        // Get ghost blog posts up until maxPosts
        const ghostFeed = await getGhostFeed(maxPosts);

        // Merge into aggregatedFeed
        aggregatedFeed.posts = aggregatedFeed.posts.concat(ghostFeed.posts);
    } catch (error) {
        logger.error(`Could not get Ghost Blog Feed:\n${error}`);
    }

    if (aggregatedFeed.posts.length != 0) {
        // Re-sort the merged posts by timestamp value
        aggregatedFeed.posts.sort((a, b) => b.publishTimestamp - a.publishTimestamp);

        if (aggregatedFeed.posts.length > maxPosts) {
            // Only keep maxPosts number of elements from the beginning of the posts array
            aggregatedFeed.posts = aggregatedFeed.posts.slice(0, maxPosts);
        }
    }

    return aggregatedFeed;
}

export async function getGhostFeed(maxPosts: number): Promise<BlogFeed> {
    const ghostFeed: BlogFeed = {
        posts: [],
    };

    try {
        const posts = await ghostApi.posts.browse({ limit: maxPosts, include: 'tags' });

        for (const post of posts) {
            const publishedAtTimestamp = Date.parse(post.published_at || '');
            const publishedAtDate = new Date(publishedAtTimestamp);

            const dateString = publishedAtDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            const tags: string[] = [];
            if (post.tags !== undefined) {
                for (const tag of post.tags) {
                    if (tag.name !== undefined) {
                        tags.push(tag.name);
                    }
                }
            }

            const ghostPost = <BlogPost>{
                title: post.title || '',
                url: post.url,
                publishDate: dateString,
                publishTimestamp: publishedAtTimestamp,
                contentSnippet: post.excerpt || '',
                tags: tags,
            };

            // Add the post to our ghostFeed object
            ghostFeed.posts.push(ghostPost);
        }
    } catch (error) {
        logger.error('Could not get Ghost feed: ', error);
        return Promise.reject(error);
    }

    return ghostFeed;
}
